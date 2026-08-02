#define ST7789_DRIVER

#define TFT_WIDTH  172
#define TFT_HEIGHT 320

#define CGRAM_OFFSET

#define TFT_MOSI 23  // SDA layar
#define TFT_SCLK 18  // SCL layar
#define TFT_CS    5  // CS layar
#define TFT_DC   19  // <--- UBAH DARI 2 MENJADI 19 (DC/RS layar)
#define TFT_RST   4  // RES/RESET layar

#define LOAD_GLCD
#define LOAD_FONT2
#define LOAD_FONT4

#define SPI_FREQUENCY  4000000

// Font standar
#define LOAD_GLCD
#define LOAD_FONT2
#define LOAD_FONT4

#define SPI_FREQUENCY  4000000