# Arduino Traintracker
Tämä repository sisältää Lappeenrannan yliopiston *Elektroniikan perusteet lukiolaisille* -kurssilla aikaansaadun projektityön lähdekoodit. Projektityön aiheeksi valitsin [rata.digitraffic.fi](https://rata.digitraffic.fi/)-rajapinnan käytön, jonka avulla saadaan LCD-näytölle junatietoja joko yksittäisestä junasta tai joltakin liikennepaikalta. Tiedot saadaan MQTT-clientin avulla, ja tiedot tallennetaan MongoDB-tietokantaan. Node-palvelimella tehdään myös tiedon aggregointi ja muut tietokantahaut, koska Arduinon 2 kt muisti ei riitä edes melko yksinkertaisen JSONin käsittelemiseen. Tämän vuoksi jouduin koodaamaan oman viestintämuodon palvelimen ja Arduinon välille.

Laite vaatii 1) Arduino Unon tai vastaavan, 2) 16x2-LCD-näytön, 3) Keypadin ja 4) Piezo-kaiuttimen toimiakseen samalla tavalla. Jos haluat ajaa koodin itse, saatat ehkä joutua muuttamaan pinnijärjestyksiä ja osoitteita. Laite käyttää [Traffic Management Finlandin julkaisemaa avointa dataa](https://rata.digitraffic.fi/), jonka lisenssi on [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.fi).

![Lohkokaavio](https://github.com/junapelaaja/arduino-traintracker/blob/master/lohkokaavio.png)
![Fritzing-piirros](https://github.com/junapelaaja/arduino-traintracker/blob/master/fritzing.png)

## Käyttäminen
Tarvitset seuraavat kirjastot Arduinon suorittamiseksi:
* [LiquidCrystal_I2C](https://bitbucket.org/fmalpartida/new-liquidcrystal/downloads/)
* Wire
* Keypad

Koneellasi pitää olla asennettuna [NodeJS](https://nodejs.org/en/) (ja npm, joka asentuu automaattisesti Noden kanssa) sekä käynnissä [MongoDB-palvelin](https://www.mongodb.com/). Halutessasi voit asentaa myös MongoDB Compass Communityn, jolla voit tarkastella tietokantaasi. Lataa tämä repository ja pura se johonkin kansioon (voit myös käyttää git-komentoja, ohjeita löytyy kyllä...), lataa **traintracker.ino** Arduinollesi ja suorita tässä hakemistossa
```
npm install
```
Tämän jälkeen npm asentaa tarvittavat paketit palvelimen käynnistämiseksi. Kun se on valmis (ja olet liittänyt Arduinon tietokoneeseen ja varmistanut, että sarjaportin nimi sekä muut parametrit kuten tietokannan osoite ovat oikein), voit suorittaa komennon
```
node server
```
Nyt palvelimen pitäisi olla päällä, ja jos et saa mitään virheilmoituksia, niin ilmoituksen "Säännöt päivitetty" ja/tai "MQTT-yhteys Digitraffic Rataan muodostettu", jälkeen voit alkaa leikkiä junaseuraajallasi!

## Videodemo
Osoitteesta [https://www.youtube.com/watch?v=pZB0i_n1jmY](https://www.youtube.com/watch?v=pZB0i_n1jmY) löytyy tekemäni videoraportti, joka sisältää myös demon laitteen toiminnasta.
