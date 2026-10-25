#include <Arduino_RouterBridge.h>
#include <LiquidCrystal.h>

const int LCD_RS_PIN = 12;
const int LCD_ENABLE_PIN = 11;
const int LCD_D4_PIN = 5;
const int LCD_D5_PIN = 4;
const int LCD_D6_PIN = 3;
const int LCD_D7_PIN = 2;
const int LCD_BACKLIGHT_PIN = 6;
const int FAN_CONTROL_PIN = 7;
const int DISMISS_SWITCH_PIN = 9;
const int BUZZER_PIN = 10;                    // Machine Love tone output (was pin 9 in the snippet)
const int HOUR_KNOB_PIN = A0;
const int MINUTE_KNOB_PIN = A1;

const unsigned long CLOCK_INTERVAL_MS = 1000;
const unsigned long BUTTON_DEBOUNCE_MS = 40;
const unsigned long SCREEN_REFRESH_MS = 200;
const unsigned long EXTERNAL_OUTPUT_LIMIT_MS = 120000;
const int HOUR_STEP_ADC = 40;
const int MINUTE_STEP_ADC = 17;

LiquidCrystal lcd(
    LCD_RS_PIN,
    LCD_ENABLE_PIN,
    LCD_D4_PIN,
    LCD_D5_PIN,
    LCD_D6_PIN,
    LCD_D7_PIN);

// ============================================================================
// Machine Love (Easy) - right-hand melody
// Tempo 170 BPM, 4/4, key of Eb. One "step" = one 16th note = 88 ms.
// Original snippet used pin 9; remapped to BUZZER_PIN (10) to avoid the
// D9 dismiss switch. Note data and timing are unchanged.
// ============================================================================
const unsigned int MELODY_OCTAVE_SHIFT = 1;   // 1 = one octave up (as original)
const unsigned int MELODY_STEP_MS = 88;       // 60000 / 170 / 4

#define REST      0
#define NOTE_C4   262
#define NOTE_DS4  311
#define NOTE_F4   349
#define NOTE_G4   392
#define NOTE_GS4  415
#define NOTE_AS4  466
#define NOTE_C5   523

// ML(frequency, length_in_16th_notes) -> { frequency, duration_in_ms }
#define ML(freq, steps) { (freq), (unsigned int)(MELODY_STEP_MS * (steps)) }

struct MelodyStep {
  unsigned int frequency;
  unsigned int durationMs;
};

const MelodyStep alarmMelody[] = {
    ML(NOTE_F4,  2),
    ML(REST,     4),
    ML(NOTE_F4,  1),
    ML(REST,     3),
    ML(NOTE_F4,  1),
    ML(REST,     3),
    ML(NOTE_F4,  1),
    ML(REST,     1),
    ML(NOTE_DS4, 2),
    ML(REST,     6),
    ML(NOTE_G4,  4),
    ML(NOTE_GS4, 4),
    ML(NOTE_AS4, 4),
    ML(NOTE_AS4, 4),
    ML(NOTE_AS4, 4),
    ML(NOTE_C5,  4),
    ML(NOTE_AS4, 8),
    ML(NOTE_G4,  4),
    ML(NOTE_GS4, 4),
    ML(NOTE_AS4, 4),
    ML(NOTE_AS4, 4),
    ML(NOTE_AS4, 4),
    ML(NOTE_C5,  4),
    ML(NOTE_AS4, 6),
    ML(NOTE_G4,  2),
    ML(NOTE_F4,  4),
    ML(NOTE_DS4, 4),
    ML(NOTE_F4,  2),
    ML(REST,     2),
    ML(NOTE_F4,  1),
    ML(REST,     1),
    ML(NOTE_F4,  2),
    ML(NOTE_F4,  2),
    ML(NOTE_DS4, 2),
    ML(NOTE_F4,  2),
    ML(NOTE_G4,  2),
    ML(NOTE_F4,  2),
    ML(NOTE_DS4, 4),
    ML(NOTE_G4,  2),
    ML(NOTE_F4,  2),
    ML(NOTE_DS4, 2),
    ML(NOTE_C4,  2),
    ML(NOTE_DS4, 2),
    ML(NOTE_F4,  2),
    ML(REST,     2),
    ML(NOTE_F4,  2),
    ML(REST,     2),
    ML(NOTE_F4,  2),
    ML(NOTE_DS4, 2),
    ML(NOTE_F4,  2),
    ML(NOTE_G4,  2),
    ML(NOTE_F4,  2),
    ML(NOTE_DS4, 4),
    ML(NOTE_DS4, 2),
    ML(NOTE_G4,  4),
    ML(NOTE_GS4, 4),
    ML(NOTE_AS4, 2),
    ML(REST,     2),
    ML(NOTE_AS4, 2),
    ML(REST,     2),
    ML(NOTE_AS4, 2),
    ML(NOTE_C5,  2),
    ML(NOTE_AS4, 2),
    ML(NOTE_C5,  2),
    ML(NOTE_AS4, 6),
    ML(NOTE_DS4, 2),
    ML(NOTE_G4,  4),
    ML(NOTE_GS4, 4),
    ML(NOTE_AS4, 2),
    ML(REST,     2),
    ML(NOTE_AS4, 2),
    ML(REST,     2),
    ML(NOTE_AS4, 2),
    ML(NOTE_C5,  2),
    ML(NOTE_AS4, 2),
    ML(NOTE_C5,  2),
    ML(NOTE_AS4, 6),
    ML(NOTE_G4,  2),
    ML(NOTE_F4,  4),
    ML(NOTE_DS4, 4),
    ML(NOTE_F4,  2),
    ML(REST,     2),
    ML(NOTE_F4,  1),
    ML(REST,     1),
    ML(NOTE_F4,  2),
    ML(NOTE_F4,  2),
    ML(NOTE_DS4, 2),
    ML(NOTE_F4,  2),
    ML(NOTE_G4,  2),
    ML(NOTE_F4,  2),
    ML(NOTE_DS4, 4),
    ML(NOTE_DS4, 2),
    ML(NOTE_F4,  2),
    ML(NOTE_DS4, 2),
    ML(NOTE_C4,  2),
    ML(NOTE_DS4, 2),
    {0, 1500},                                // 1.5 s pause before looping; delete for continuous
};

const unsigned int ALARM_MELODY_STEP_COUNT =
    sizeof(alarmMelody) / sizeof(alarmMelody[0]);

enum ClockState { SET_CURRENT_TIME, SET_ALARM_TIME };
ClockState currentMode = SET_CURRENT_TIME;

int hours = 12;
int minutes = 0;
int seconds = 0;
int alarmHours = 6;
int alarmMinutes = 30;
bool alarmSet = true;
bool alarmActive = false;
volatile bool alarmStartedEvent = false;
volatile bool alarmDismissedEvent = false;

unsigned long previousClockMillis = 0;
unsigned long melodyStepStartedAt = 0;
unsigned long externalOutputsStartedAt = 0;
unsigned long externalOutputsDurationMs = 0;
unsigned long lastScreenRefreshAt = 0;
unsigned int melodyStepIndex = 0;
bool externalOutputsActive = false;
bool lastSwitchState = HIGH;
bool melodyStepStarted = false;

int anchorHourPot = 0;
int anchorMinutePot = 0;

void stopAlarm() {
  alarmActive = false;
  noTone(BUZZER_PIN);
  digitalWrite(FAN_CONTROL_PIN, LOW);
  digitalWrite(LED_BUILTIN, HIGH);
  melodyStepStarted = false;
}

void startAlarm() {
  if (alarmActive) {
    return;
  }
  alarmActive = true;
  alarmStartedEvent = true;
  melodyStepIndex = 0;
  melodyStepStarted = false;
  digitalWrite(FAN_CONTROL_PIN, HIGH);       // fan ON immediately
  digitalWrite(LED_BUILTIN, LOW);
}

// Non-blocking melody player. Each note sounds for 85% of its length, then a
// 15% silent gap, matching the original Machine Love snippet's staccato feel.
void advanceMelody(unsigned long now) {
  if (!alarmActive) {
    return;
  }

  if (!melodyStepStarted) {
    const MelodyStep step = alarmMelody[melodyStepIndex];
    if (step.frequency == 0) {
      noTone(BUZZER_PIN);
    } else {
      tone(BUZZER_PIN, step.frequency << MELODY_OCTAVE_SHIFT);
    }
    melodyStepStartedAt = now;
    melodyStepStarted = true;
    return;
  }

  const MelodyStep step = alarmMelody[melodyStepIndex];
  const unsigned long elapsed = now - melodyStepStartedAt;

  if (step.frequency != 0 && elapsed >= (step.durationMs * 85UL) / 100UL) {
    noTone(BUZZER_PIN);
  }

  if (elapsed >= step.durationMs) {
    melodyStepIndex = (melodyStepIndex + 1) % ALARM_MELODY_STEP_COUNT;
    melodyStepStarted = false;
  }
}

void advanceClock(unsigned long now) {
  while (now - previousClockMillis >= CLOCK_INTERVAL_MS) {
    previousClockMillis += CLOCK_INTERVAL_MS;
    seconds++;
    if (seconds >= 60) {
      seconds = 0;
      minutes++;
      if (minutes >= 60) {
        minutes = 0;
        hours = (hours + 1) % 24;
      }
    }
    if (alarmSet && hours == alarmHours && minutes == alarmMinutes &&
        seconds == 0) {
      startAlarm();
    }
  }
}

void updateKnobs() {
  const int currentHourPot = analogRead(HOUR_KNOB_PIN);
  const int hourDiff = currentHourPot - anchorHourPot;
  if (abs(hourDiff) >= HOUR_STEP_ADC) {
    const int hourSteps = hourDiff / HOUR_STEP_ADC;
    if (currentMode == SET_CURRENT_TIME) {
      hours = (hours + hourSteps) % 24;
      if (hours < 0) hours += 24;
    } else {
      alarmHours = (alarmHours + hourSteps) % 24;
      if (alarmHours < 0) alarmHours += 24;
    }
    anchorHourPot = constrain(anchorHourPot + hourSteps * HOUR_STEP_ADC, 0, 1023);
  }

  const int currentMinutePot = analogRead(MINUTE_KNOB_PIN);
  const int minuteDiff = currentMinutePot - anchorMinutePot;
  if (abs(minuteDiff) >= MINUTE_STEP_ADC) {
    const int minuteSteps = minuteDiff / MINUTE_STEP_ADC;
    if (currentMode == SET_CURRENT_TIME) {
      minutes = (minutes + minuteSteps) % 60;
      if (minutes < 0) minutes += 60;
    } else {
      alarmMinutes = (alarmMinutes + minuteSteps) % 60;
      if (alarmMinutes < 0) alarmMinutes += 60;
    }
    anchorMinutePot = constrain(anchorMinutePot + minuteSteps * MINUTE_STEP_ADC, 0, 1023);
  }
}

void printTwoDigits(int value) {
  if (value < 10) lcd.print('0');
  lcd.print(value);
}

void renderScreen() {
  lcd.setCursor(0, 0);
  if (alarmActive) {
    lcd.print("  TETO'CLOCK!!  ");
    lcd.setCursor(0, 1);
    lcd.print("Click switch off");
    return;
  }
  if (currentMode == SET_CURRENT_TIME) {
    lcd.print("  CURRENT TIME  ");
    lcd.setCursor(0, 1);
    lcd.print("    ");
    printTwoDigits(hours);
    lcd.print(':');
    printTwoDigits(minutes);
    lcd.print(':');
    printTwoDigits(seconds);
    lcd.print("    ");
  } else {
    lcd.print(" SET ALARM TIME ");
    lcd.setCursor(0, 1);
    lcd.print("      ");
    printTwoDigits(alarmHours);
    lcd.print(':');
    printTwoDigits(alarmMinutes);
    lcd.print("      ");
  }
}

void startOutputs(int durationMs) {
  if (durationMs <= 0 ||
      static_cast<unsigned long>(durationMs) > EXTERNAL_OUTPUT_LIMIT_MS) {
    externalOutputsActive = false;
    digitalWrite(LED_BUILTIN, HIGH);
    if (!alarmActive) digitalWrite(FAN_CONTROL_PIN, LOW);
    return;
  }
  externalOutputsStartedAt = millis();
  externalOutputsDurationMs = static_cast<unsigned long>(durationMs);
  externalOutputsActive = true;
  digitalWrite(FAN_CONTROL_PIN, HIGH);
  digitalWrite(LED_BUILTIN, LOW);
}

void stopOutputs() {
  externalOutputsActive = false;
  if (!alarmActive) {
    digitalWrite(FAN_CONTROL_PIN, LOW);
    digitalWrite(LED_BUILTIN, HIGH);
  }
}

int consumeAlarmStarted() {
  const bool started = alarmStartedEvent;
  alarmStartedEvent = false;
  return started ? 1 : 0;
}

int consumeAlarmDismissed() {
  const bool dismissed = alarmDismissedEvent;
  alarmDismissedEvent = false;
  return dismissed ? 1 : 0;
}

void setup() {
  pinMode(DISMISS_SWITCH_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(FAN_CONTROL_PIN, OUTPUT);
  pinMode(LCD_BACKLIGHT_PIN, OUTPUT);
  pinMode(LED_BUILTIN, OUTPUT);

  digitalWrite(LCD_BACKLIGHT_PIN, LOW);
  digitalWrite(FAN_CONTROL_PIN, LOW);
  digitalWrite(LED_BUILTIN, HIGH);
  noTone(BUZZER_PIN);

  lcd.begin(16, 2);
  lcd.print("TETO'Clock Ready");
  delay(1000);
  lcd.clear();

  hours = map(analogRead(HOUR_KNOB_PIN), 0, 1023, 0, 23);
  minutes = map(analogRead(MINUTE_KNOB_PIN), 0, 1023, 0, 59);
  alarmHours = hours;
  alarmMinutes = minutes;
  anchorHourPot = analogRead(HOUR_KNOB_PIN);
  anchorMinutePot = analogRead(MINUTE_KNOB_PIN);
  previousClockMillis = millis();

  lastSwitchState = digitalRead(DISMISS_SWITCH_PIN);

  Bridge.begin();
  Bridge.provide("start_outputs", startOutputs);
  Bridge.provide("stop_outputs", stopOutputs);
  Bridge.provide("consume_alarm_started", consumeAlarmStarted);
  Bridge.provide("consume_alarm_dismissed", consumeAlarmDismissed);
}

void loop() {
  const unsigned long now = millis();
  advanceClock(now);

  if (externalOutputsActive &&
      now - externalOutputsStartedAt >= externalOutputsDurationMs) {
    externalOutputsActive = false;
    if (!alarmActive) {
      digitalWrite(FAN_CONTROL_PIN, LOW);
      digitalWrite(LED_BUILTIN, HIGH);
    }
  }

  const bool currentSwitchState = digitalRead(DISMISS_SWITCH_PIN);
  if (currentSwitchState != lastSwitchState) {
    delay(BUTTON_DEBOUNCE_MS);
    const bool stableSwitchState = digitalRead(DISMISS_SWITCH_PIN);
    if (stableSwitchState == currentSwitchState) {
      if (stableSwitchState == LOW) {
        if (alarmActive) {
          stopAlarm();                    // <<< the ONLY place the alarm stops
          alarmDismissedEvent = true;
        } else {
          currentMode = currentMode == SET_CURRENT_TIME
                            ? SET_ALARM_TIME
                            : SET_CURRENT_TIME;
          anchorHourPot = analogRead(HOUR_KNOB_PIN);
          anchorMinutePot = analogRead(MINUTE_KNOB_PIN);
        }
      }
      lastSwitchState = stableSwitchState;
    }
  }

  if (!alarmActive) {
    updateKnobs();
  } else {
    advanceMelody(now);                   // non-blocking, runs every loop pass
  }

  if (now - lastScreenRefreshAt >= SCREEN_REFRESH_MS) {
    lastScreenRefreshAt = now;
    renderScreen();
  }
}
