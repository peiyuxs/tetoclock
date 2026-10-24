void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("Teto'Clock safe board test starting.");
  Serial.println("Speaker output is disabled. Keep the speaker disconnected.");
}

void loop() {
  Serial.println("LED test: three flashes.");
  for (int flash = 0; flash < 3; flash++) {
    digitalWrite(LED_BUILTIN, HIGH);
    delay(250);
    digitalWrite(LED_BUILTIN, LOW);
    delay(250);
  }
  Serial.println("Test complete. Repeating in 2 seconds.");
  delay(2000);
}
