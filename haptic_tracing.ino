
const int ENA = 13;   
const int IN1 = 12;  
const int IN2 = 14;  

const bool USE_TOUCH_BUTTON = true;
const int  TOUCH_PIN        = 4;    
const int  TOUCH_THRESHOLD  = 30;  
const unsigned long TOUCH_DEBOUNCE_MS = 700;

struct Step    { uint8_t intensity; uint16_t ms; };
struct Pattern { const Step* steps; uint8_t len; bool loops; };

const Step ON_LINE[]    = { {110, 100} };                
const Step OFF_LINE[]   = { {255, 70}, {0, 70} };           
const Step CHECKPOINT[] = { {90,40},{150,40},{210,40},{255,60},{210,40},{150,40},{90,40} };
const Step COMPLETE[]   = { 
  {255,90},{0,70},{200,110},{0,380},
  {255,90},{0,70},{200,110},{0,380},
  {255,90},{0,70},{200,110},{0,100}
};

#define COUNT(a) (sizeof(a) / sizeof(a[0]))
const Pattern P_ON    = { ON_LINE,    COUNT(ON_LINE),    true  };
const Pattern P_OFF   = { OFF_LINE,   COUNT(OFF_LINE),   true  };
const Pattern P_CHECK = { CHECKPOINT, COUNT(CHECKPOINT), false };
const Pattern P_DONE  = { COMPLETE,   COUNT(COMPLETE),   false };

const Pattern* basePattern    = nullptr;  
const Pattern* overlayPattern = nullptr; 
const Pattern* active         = nullptr;
uint8_t stepIdx = 0;
unsigned long stepStart = 0;
unsigned long lastTouchMs = 0;

void setMotor(uint8_t intensity) {
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  analogWrite(ENA, intensity);
}

void startPattern(const Pattern* p) {
  active = p;
  stepIdx = 0;
  stepStart = millis();
  setMotor(p ? p->steps[0].intensity : 0);
}

void updatePattern() {
  if (!active) return;
  if (millis() - stepStart < active->steps[stepIdx].ms) return;

  stepIdx++;
  if (stepIdx >= active->len) {
    if (active->loops) {
      stepIdx = 0;
    } else {                     
      overlayPattern = nullptr;
      startPattern(basePattern);
      return;
    }
  }
  stepStart = millis();
  setMotor(active->steps[stepIdx].intensity);
}

void handleCommand(char c) {
  switch (c) {
    case 'A': basePattern = &P_ON;  if (!overlayPattern) startPattern(basePattern); break;
    case 'B': basePattern = &P_OFF; if (!overlayPattern) startPattern(basePattern); break;
    case 'S': basePattern = nullptr; if (!overlayPattern) startPattern(nullptr);    break;
    case 'C': overlayPattern = &P_CHECK; startPattern(overlayPattern); break;
    case 'D': overlayPattern = &P_DONE;  startPattern(overlayPattern); break;
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(ENA, OUTPUT);
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  startPattern(nullptr);
}

void loop() {
  while (Serial.available()) handleCommand((char)Serial.read());
  updatePattern();

  if (USE_TOUCH_BUTTON && touchRead(TOUCH_PIN) < TOUCH_THRESHOLD &&
      millis() - lastTouchMs > TOUCH_DEBOUNCE_MS) {
    lastTouchMs = millis();
    Serial.println('N');
  }
}
