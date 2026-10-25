#include <Arduino_RouterBridge.h>

const int FAN_CONTROL_PIN = 3;
const int DISMISS_BUTTON_PIN = 2;
const unsigned long MAX_SPEAKING_TIME_MS = 120000;
const unsigned long BUTTON_DEBOUNCE_MS = 40;

bool isSpeaking = false;
bool alarmDismissed = false;
unsigned long speakingStartedAt = 0;
unsigned long speakingDurationMs = 0;
int lastButtonReading = HIGH;
int stableButtonState = HIGH;
unsigned long buttonChangedAt = 0;

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

  alarmDismissed = false;
  speakingStartedAt = millis();
  speakingDurationMs = static_cast<unsigned long>(durationMs);
  isSpeaking = true;
  digitalWrite(LED_BUILTIN, LOW);
  digitalWrite(FAN_CONTROL_PIN, HIGH);
}

int consumeAlarmDismissed() {
  const bool dismissed = alarmDismissed;
  alarmDismissed = false;
  return dismissed ? 1 : 0;
}

void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
  digitalWrite(LED_BUILTIN, HIGH);

  pinMode(FAN_CONTROL_PIN, OUTPUT);
  digitalWrite(FAN_CONTROL_PIN, LOW);

  pinMode(DISMISS_BUTTON_PIN, INPUT_PULLUP);
  lastButtonReading = digitalRead(DISMISS_BUTTON_PIN);
  stableButtonState = lastButtonReading;
  buttonChangedAt = millis();

  Bridge.begin();
  Bridge.provide("start_outputs", startOutputs);
  Bridge.provide("stop_outputs", stopOutputs);
  Bridge.provide("consume_alarm_dismissed", consumeAlarmDismissed);
}

void loop() {
  const int reading = digitalRead(DISMISS_BUTTON_PIN);
  if (reading != lastButtonReading) {
    lastButtonReading = reading;
    buttonChangedAt = millis();
  }

  if (reading != stableButtonState &&
      millis() - buttonChangedAt >= BUTTON_DEBOUNCE_MS) {
    stableButtonState = reading;
    if (stableButtonState == LOW && isSpeaking) {
      stopOutputs();
      alarmDismissed = true;
    }
  }

  if (isSpeaking && millis() - speakingStartedAt >= speakingDurationMs) {
    stopOutputs();
  }
}