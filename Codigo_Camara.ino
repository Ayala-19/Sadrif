/* =======================================================================
   SADRIF - Camara ESP32-CAM (AI-Thinker)
   -----------------------------------------------------------------------
   Sirve un stream MJPEG por WiFi para capturarlo en OBS y retransmitir
   a Twitch.

   Endpoints una vez conectada (la IP sale por el puerto serie):
     http://<IP>/          -> pagina de prueba con el video
     http://<IP>/jpg       -> una sola foto (util para comprobar)
     http://<IP>:81/stream -> el stream MJPEG  <-- ESTA es la de OBS

   COMO CARGARLO
     1. Arduino IDE -> Herramientas:
          Placa:        "AI Thinker ESP32-CAM"
          Partition:    "Huge APP (3MB No OTA/1MB SPIFFS)"
          PSRAM:        Enabled
          Upload Speed: 115200
     2. Puentea GPIO0 con GND, pulsa RESET y dale a Subir.
     3. AL TERMINAR: quita el puente GPIO0-GND y pulsa RESET.
        (Si lo dejas puesto la placa NO ejecuta nada, solo se enciende
         el LED rojo. Es el fallo mas comun.)
     4. Monitor serie a 115200 para ver el diagnostico y la IP.

   ALIMENTACION
     Por el pin 5V con una fuente de 5V y al menos 1A (mejor 2A).
     Con los 3.3V de un FTDI NO funciona: arranca y se reinicia en
     cuanto la camara pide corriente.

   COMO METERLO EN OBS
     Fuente -> VLC Video Source -> anadir ruta/URL -> http://<IP>:81/stream
     (Si VLC da problemas, usa una fuente "Navegador" con la misma URL.)
   ======================================================================= */

#include "esp_camera.h"
#include <WiFi.h>
#include "esp_http_server.h"
#include "esp_timer.h"
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"

/* ---------------- CONFIGURA ESTO ---------------- */
const char *WIFI_SSID = "Sadrif";
const char *WIFI_PASS = "Sadrif19";

// Nombre de red de la placa.
const char *HOSTNAME = "sadrif-cam";

// true  = LED blanco potente encendido de forma fija (ojo: calienta)
// false = apagado (por defecto)
const bool FLASH_SIEMPRE_ENCENDIDO = false;
/* ------------------------------------------------ */

/* Pines de la AI-Thinker. Van aqui a proposito para no depender de
   camera_pins.h ni de que el #define del modelo este bien puesto. */
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22
#define LED_FLASH_GPIO 4

#define PART_BOUNDARY "123456789000000000000987654321"
static const char *STREAM_CONTENT_TYPE = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char *STREAM_BOUNDARY = "\r\n--" PART_BOUNDARY "\r\n";
static const char *STREAM_PART = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

httpd_handle_t servidor_web = NULL;
httpd_handle_t servidor_stream = NULL;

/* ---------------- Pagina de prueba ---------------- */
static const char PAGINA[] PROGMEM = R"HTML(
<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SADRIF - Camara</title>
<style>
 body{margin:0;background:#101413;color:#e8efe9;font-family:system-ui,sans-serif;
      display:flex;flex-direction:column;align-items:center;gap:1rem;padding:1.5rem}
 img{width:min(100%,800px);border-radius:10px;background:#000;display:block}
 code{background:#1e2523;padding:.15rem .4rem;border-radius:4px}
</style></head><body>
<h1>Camara SADRIF</h1>
<img src="" id="v" alt="stream">
<p>URL para OBS: <code id="u"></code></p>
<script>
 var base = location.hostname;
 var url = "http://" + base + ":81/stream";
 document.getElementById("v").src = url;
 document.getElementById("u").textContent = url;
</script>
</body></html>
)HTML";

static esp_err_t handler_index(httpd_req_t *req) {
  httpd_resp_set_type(req, "text/html");
  return httpd_resp_send(req, (const char *)PAGINA, HTTPD_RESP_USE_STRLEN);
}

/* ---------------- Foto suelta ---------------- */
static esp_err_t handler_jpg(httpd_req_t *req) {
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("[jpg] fallo al capturar");
    httpd_resp_send_500(req);
    return ESP_FAIL;
  }
  httpd_resp_set_type(req, "image/jpeg");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Content-Disposition", "inline; filename=sadrif.jpg");
  esp_err_t res = httpd_resp_send(req, (const char *)fb->buf, fb->len);
  esp_camera_fb_return(fb);
  return res;
}

/* ---------------- Stream MJPEG ---------------- */
static esp_err_t handler_stream(httpd_req_t *req) {
  camera_fb_t *fb = NULL;
  esp_err_t res = ESP_OK;
  char cabecera[64];
  int64_t ultimo = esp_timer_get_time();
  int contador = 0;

  res = httpd_resp_set_type(req, STREAM_CONTENT_TYPE);
  if (res != ESP_OK) return res;
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");

  Serial.println("[stream] cliente conectado");

  while (true) {
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("[stream] fallo al capturar frame");
      res = ESP_FAIL;
      break;
    }

    size_t len = fb->len;
    uint8_t *buf = fb->buf;
    uint8_t *jpg_convertido = NULL;

    // Si por lo que sea no viene en JPEG, lo convertimos.
    if (fb->format != PIXFORMAT_JPEG) {
      if (!frame2jpg(fb, 80, &jpg_convertido, &len)) {
        Serial.println("[stream] fallo en la compresion JPEG");
        esp_camera_fb_return(fb);
        res = ESP_FAIL;
        break;
      }
      buf = jpg_convertido;
    }

    res = httpd_resp_send_chunk(req, STREAM_BOUNDARY, strlen(STREAM_BOUNDARY));
    if (res == ESP_OK) {
      size_t n = snprintf(cabecera, sizeof(cabecera), STREAM_PART, (unsigned)len);
      res = httpd_resp_send_chunk(req, cabecera, n);
    }
    if (res == ESP_OK) {
      res = httpd_resp_send_chunk(req, (const char *)buf, len);
    }

    if (jpg_convertido) free(jpg_convertido);
    esp_camera_fb_return(fb);

    if (res != ESP_OK) break;

    int64_t ahora = esp_timer_get_time();
    long ms = (long)((ahora - ultimo) / 1000);
    ultimo = ahora;
    if (++contador % 100 == 0) {
      Serial.printf("[stream] %ld ms/frame (~%.1f fps)\n", ms, ms > 0 ? 1000.0 / ms : 0.0);
    }
  }

  Serial.println("[stream] cliente desconectado");
  return res;
}

void arrancarServidores() {
  httpd_config_t cfg = HTTPD_DEFAULT_CONFIG();
  cfg.server_port = 80;
  cfg.ctrl_port = 32768;
  cfg.max_uri_handlers = 8;

  httpd_uri_t uri_index = { "/", HTTP_GET, handler_index, NULL };
  httpd_uri_t uri_jpg = { "/jpg", HTTP_GET, handler_jpg, NULL };

  if (httpd_start(&servidor_web, &cfg) == ESP_OK) {
    httpd_register_uri_handler(servidor_web, &uri_index);
    httpd_register_uri_handler(servidor_web, &uri_jpg);
  } else {
    Serial.println("[http] no se pudo arrancar el servidor del puerto 80");
  }

  // El stream va en su propio servidor (puerto 81) porque bloquea el
  // worker mientras dura; asi la pagina y /jpg siguen respondiendo.
  cfg.server_port = 81;
  cfg.ctrl_port = 32769;
  httpd_uri_t uri_stream = { "/stream", HTTP_GET, handler_stream, NULL };
  if (httpd_start(&servidor_stream, &cfg) == ESP_OK) {
    httpd_register_uri_handler(servidor_stream, &uri_stream);
  } else {
    Serial.println("[http] no se pudo arrancar el servidor del puerto 81");
  }
}

/* ---------------- Arranque ---------------- */
void setup() {
  // Evita que el detector de brownout reinicie la placa en los picos de
  // consumo. NO sustituye a una buena fuente de 5V, solo da margen.
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);

  Serial.begin(115200);
  Serial.setDebugOutput(true);
  delay(300);
  Serial.println();
  Serial.println("=============================================");
  Serial.println(" SADRIF - ESP32-CAM");
  Serial.println("=============================================");

  pinMode(LED_FLASH_GPIO, OUTPUT);
  digitalWrite(LED_FLASH_GPIO, FLASH_SIEMPRE_ENCENDIDO ? HIGH : LOW);

  bool hay_psram = psramFound();
  Serial.printf("PSRAM: %s\n", hay_psram ? "SI detectada" : "NO detectada");
  if (!hay_psram) {
    Serial.println("  -> Sin PSRAM se baja la resolucion a SVGA.");
    Serial.println("  -> Revisa Herramientas > PSRAM = Enabled.");
  }

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.grab_mode = CAMERA_GRAB_LATEST;
  config.fb_location = hay_psram ? CAMERA_FB_IN_PSRAM : CAMERA_FB_IN_DRAM;

  if (hay_psram) {
    config.frame_size = FRAMESIZE_HD;  // 1280x720, va bien para OBS
    config.jpeg_quality = 12;          // menor numero = mas calidad
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA;  // 800x600
    config.jpeg_quality = 14;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("\n*** ERROR: la camara no inicializa (0x%x) ***\n", err);
    Serial.println("Causas por orden de probabilidad:");
    Serial.println("  1. Alimentacion floja -> usa 5V / 1-2A por el pin 5V.");
    Serial.println("  2. Cable plano de la camara suelto o mal metido.");
    Serial.println("  3. Placa equivocada en el IDE (debe ser AI Thinker ESP32-CAM).");
    Serial.println("  4. PSRAM desactivada con una resolucion alta.");
    Serial.println("Reiniciando en 5 s...");
    delay(5000);
    ESP.restart();
  }
  Serial.println("Camara: OK");

  // Ajustes de imagen.
  sensor_t *s = esp_camera_sensor_get();
  if (s) {
    Serial.printf("Sensor detectado: PID 0x%x\n", s->id.PID);
    if (s->id.PID == OV3660_PID) {
      s->set_vflip(s, 1);
      s->set_brightness(s, 1);
      s->set_saturation(s, -2);
    }
    s->set_hmirror(s, 0);
    s->set_whitebal(s, 1);
    s->set_gain_ctrl(s, 1);
    s->set_exposure_ctrl(s, 1);
  }

  // WiFi
  WiFi.persistent(false);
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);  // sin esto el stream va a tirones
  WiFi.setHostname(HOSTNAME);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.printf("Conectando a \"%s\"", WIFI_SSID);
  unsigned long t0 = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - t0 < 20000) {
    delay(400);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("*** No se ha podido conectar al WiFi ***");
    Serial.println("  - Revisa SSID y contrasena arriba del todo.");
    Serial.println("  - La ESP32 SOLO va en 2,4 GHz, no en 5 GHz.");
    Serial.println("Reiniciando en 5 s...");
    delay(5000);
    ESP.restart();
  }

  Serial.printf("WiFi: OK   senal %d dBm\n", WiFi.RSSI());
  arrancarServidores();

  Serial.println("---------------------------------------------");
  Serial.print("Pagina de prueba : http://");
  Serial.println(WiFi.localIP());
  Serial.print("Foto suelta      : http://");
  Serial.print(WiFi.localIP());
  Serial.println("/jpg");
  Serial.print("STREAM PARA OBS  : http://");
  Serial.print(WiFi.localIP());
  Serial.println(":81/stream");
  Serial.println("---------------------------------------------");
}

void loop() {
  // Si se cae el WiFi, reconecta sola.
  static unsigned long ultimo_chequeo = 0;
  if (millis() - ultimo_chequeo > 10000) {
    ultimo_chequeo = millis();
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[wifi] caido, reconectando...");
      WiFi.disconnect();
      WiFi.begin(WIFI_SSID, WIFI_PASS);
    }
  }
  delay(100);
}
