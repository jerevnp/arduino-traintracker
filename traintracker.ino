#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <Keypad.h>

// Käytetään LiquidCrystal_I2C-kirjastoa LCD-näytön ohjaamiseen
LiquidCrystal_I2C lcd(0x27, 2, 1, 0, 4, 5, 6, 7, 3, POSITIVE);

// Komento eli junanumero tai UIC-koodi
String command = "";
// Tila. Voi olla "TRAIN" tai "STATION"
String mode = "TRAIN";
// Tähän luetaan sarjaporttiin saapunut viesti.
String inData;

const byte ROWS = 4; // Keypadin rivit
const byte COLS = 3; // Keypadin sarakkeet
char keys[ROWS][COLS] = {
  {'1','2','3'},
  {'4','5','6'},
  {'7','8','9'},
  {'*','0','#'}
};
byte rowPins[ROWS] = {2,5,4,3}; // Rivien pinnit
byte colPins[COLS] = {6,7,8}; // Sarakkeiden pinnit

// Keypad-kirjasto keypadin lukemiseen
Keypad keypad = Keypad( makeKeymap(keys), rowPins, colPins, ROWS, COLS );

void setup() {
  Serial.begin(9600);
  // LCD-näytössä on 16 paikkaa kahdella rivillä
  lcd.begin(16, 2);
  // Aloitetaan kysymällä junanumeroa
  println("Junanumero:", true);
}

void loop() {
  // Kun sarjaportissa on luettavaa..
  while (Serial.available() > 0) {
    // Luetaan yksi kirjain
    char received = Serial.read();
    // Jos kirjain ei ole rivinvaihtomerkki, siirretään se inData-muuttujan jatkoksi, muuten suoritetaan if-blokissa oleva koodi
    if (received == '\n') {
      // Riviin 60 asti käytössä on deserialisaatio itse keksimälleni viestimuodolle. Käytännössä kaksoispiste erottelee eri parametrit.
      int firstDelim = inData.indexOf(':');
      int secondDelim = inData.indexOf(':', firstDelim + 1);
      int thirdDelim = inData.indexOf(':', secondDelim + 1);
      int fourthDelim = inData.indexOf(':', thirdDelim + 1);
      int fifthDelim = inData.indexOf(':', fourthDelim + 1);
      int sixthDelim = inData.indexOf(':', fifthDelim + 1);
      int seventhDelim = inData.indexOf(':', sixthDelim + 1);

      String opState = inData.substring(0, firstDelim); // opState määrittää, mitä palvelin haluaa meille kertoa.
      String firstParam = inData.substring(firstDelim + 1, secondDelim);
      String secondParam = inData.substring(secondDelim + 1, thirdDelim);
      String thirdParam = inData.substring(thirdDelim + 1, fourthDelim);
      String fourthParam = inData.substring(fourthDelim + 1, fifthDelim);
      String fifthParam = inData.substring(fifthDelim + 1, sixthDelim);
      String sixthParam = inData.substring(sixthDelim + 1, seventhDelim);
      String seventhParam = inData.substring(seventhDelim + 1, inData.length());

    // Jos opState on "TOK" eli "TrainOK", palvelin on varmistanut MQTT-tilauksen
      if (opState == "TOK") {
        println(secondParam + firstParam, true); // secondParam on linjatunnus (G, Z, K, N, Y jne.) ja firstParam junanumero
      } else if (opState == "SOK") { // "StationOK"
        println(firstParam, true); // Aseman nimi (esim. Järvelä, Lahti, Lappeenranta)
      } else if (opState == "S") { // "Station" eli asemalle saapuva juna on muuttunut
        String train = firstParam;
        String typeOrLine = secondParam;
        String estimate = thirdParam;
        String type = fourthParam;
        String track = fifthParam;
        println(typeOrLine + train, true);
        println(estimate + " " + type + track, false);

        tone(10, 2000, 500); // Soitetaan äänimerkki
      } else if (opState == "T") { // "Train" eli junan tiedot ovat muuttuneet
        String trainNumber = firstParam;
        String lineID = secondParam;
        String station = fourthParam;
        String trackSection = fifthParam;
        String type = sixthParam == "OCCUPY" ? "O" : "R";  // Tyyppi voi olla "R" eli "RELEASE" jos raideosuus on oikeasti vapautunut (Node-palvelin ei lähetä näitä viestejä, koska ne ovat hieman epävarmoja, sillä kaikki raideosuudet eivät lähetä vapautumisviestiä) TAI jos raideosuustietoa ei ole
        String estimate = thirdParam;
        String speedd = seventhParam;
        println(lineID + trainNumber + " " + type + " " + speedd + "km/h", true);
        println(station + " " + trackSection + " " + estimate + "s", false); // Arvio seuraavalle liikennepaikalle saapumisesta tai lähtemisestä sekunteina

        tone(10, 2000, 500);
        /*
         * "TrackAccept"-viestejä palvelin ei tällä hetkellä lähetä (ne perustuvat herätepisteisiin, jotka ovat epätarkempia).
         */
      } else if (opState == "TRA") {
        String trainNumber = firstParam;
        String typeOrLine = secondParam;
        String station = thirdParam;
        String type = fourthParam;
        int offset = fifthParam.toInt();

        if (offset > 0) {
          String typeLocalized = type == "ARRIVAL" ? " saapuu " : " lähti ";
          for (int i = offset; i >= 0; i--) {
            println(typeOrLine + trainNumber + " " + typeLocalized, true);
            println(station + " " + i + "sek.", false);
            tone(10, 5000, 50);
            delay(950);
          }
        }
      }

      // Viesti on luettu, tyhjennetään inData.
      inData = "";
    } else {
      // Liitetään saapuva merkki inDatan jatkoksi.
      inData += received;
    }
  }

  char key = keypad.getKey();
  // Jos jokin nappi on painettuna keypadilla...
  if (key != NO_KEY){
    if (key == '*') {
      Serial.println(mode + "::" + command); // Lähetetään palvelimelle viesti sarjaportissa
      command = "";
      println("Odota hetki...", true); // Tulostetaan latausilmoitus LCD-näytölle
      tone(10, 2000, 100); // Soitetaan "PIP-PIP"-äänimerkki.
      delay(200);
      tone(10, 2000, 100);
    } else if (key == '#') { // Vaihdetaan tilaa.
      if (mode == "TRAIN") {
        mode = "STATION";
        println("Aseman UID:", true);
        tone(10, 2000, 100);
        delay(200);
        tone(10, 2000, 100);
      } else {
        mode = "TRAIN";
        println("Junanumero:", true);
        tone(10, 2000, 100);
        delay(200);
        tone(10, 2000, 100);
      }
    } else {
     command = command + key;
     lcd.print(key); // Lisätään LCD-näytölle painettu näppäin
     tone(10, 2000, 100);
    }
  }
}

/*
 * LCD-näytön käyttämistä helpottava funktio. clear-parametrilla näyttö voidaan tyhjentää.
 */
void println(String rawMessage, boolean clear) {
  String message = rawMessage;
  if (clear) {
   lcd.clear();
  }
  lcd.print(message);
  lcd.setCursor(0, 1);
}
