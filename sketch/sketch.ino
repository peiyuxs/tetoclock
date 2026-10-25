#include <Arduino_RouterBridge.h>

const int FAN_CONTROL_PIN = 3;
const unsigned long MAX_SPEAKING_TIME_MS = 120000;

bool isSpeaking = false;
unsigned long speakingStartedAt = 0;
unsigned long speakingDurationMs = 0;

void stopOutputs() {
  digitalWrite(LED_BUILTIN, HIGH);
  digitalWrite(FAN_CONTROL_PIN, LOW);
  isSpeaking = false;
}

void startOutputs(int durationMs) {
  if (durationMs <= 0 || durationMs > MAX_SPEAKING_TIME_MS) {
    stopOutputs();
    return;
  }

  speakingStartedAt = millis();
  speakingDurationMs = static_cast<unsigned long>(durationMs);
  isSpeaking = true;
  digitalWrite(LED_BUILTIN, LOW);
  digitalWrite(FAN_CONTROL_PIN, HIGH);
}

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);

  pinMode(FAN_CONTROL_PIN, OUTPUT);
  digitalWrite(FAN_CONTROL_PIN, LOW);

  Bridge.begin();
  Bridge.provide("start_outputs", startOutputs);
  Bridge.provide("stop_outputs", stopOutputs);
}

void loop() {
  if (isSpeaking && millis() - speakingStartedAt >= speakingDurationMs) {
    stopOutputs();
  }
}