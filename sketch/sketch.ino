// put function declarations here:
int myFunction(int, int);

void setup() {
  // put your setup code here, to run once:
  // Initialize the built-in LED pin as an output
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  // put your main code here, to run repeatedly:
  digitalWrite(LED_BUILTIN, HIGH); // Turn the LED on
  delay(1000);                     // Wait for 1 second
  digitalWrite(LED_BUILTIN, LOW);  // Turn the LED off
  delay(1000);                     // Wait for 1 second
}

// put function definitions here:
int myFunction(int x, int y) {
  return x + y;
}