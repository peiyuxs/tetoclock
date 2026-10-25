void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, LOW);
  Serial.begin(115200);
  Serial.println("Teto'Clock speech indicator ready.");
}

void loop() {
  if (Serial.available() > 0) {
    String command = Serial.readStringUntil('\n');
    command.trim();

    if (command == "PING") {
      Serial.println("READY");
    } else if (command == "SPEAKING") {
      digitalWrite(LED_BUILTIN, HIGH);
    } else if (command == "IDLE") {
      digitalWrite(LED_BUILTIN, LOW);
    }
  }
}
