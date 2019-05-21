const MQTT = require('mqtt');
const SerialPort = require('serialport');
const Readline = require('@serialport/parser-readline');
const axios = require('axios');
const mongoose = require('mongoose');
const moment = require('moment');
const _ = require('lodash');

/*
 * VAIHDA tähän true, kun käynnistät koodin ensimmäistä kertaa tai haluat muuten vain päivittää tietokannan
 * asemat ja herätepisteet. Vaihda sen jälkeen takaisin false, sillä tämä operaatio vie aikaa.
 */
const initializeCollections = false;

// Junien tietokantarakenne Mongoosea varten
const trainSchema = new mongoose.Schema({
  trainNumber: {
    type: String,
    required: true,
  },
  speed: {
    type: Number,
    required: false,
  },
  runningMessage: {
    station: {
      type: String,
      required: false
    },
    trackSection: {
      type: String,
      required: false
    },
    type: {
      type: String,
      required: false
    },
  },
  departureDate: {
    type: Date,
    required: true,
  },
  operatorUICCode: {
    type: Number,
    required: true,
  },
  operatorShortCode: {
    type: String,
    required: true,
  },
  trainType: {
    type: String,
    required: true,
  },
  trainCategory: {
    type: String,
    required: true,
  },
  commuterLineID: {
    type: String,
    required: false,
  },
  runningCurrently: {
    type: Boolean,
    required: true,
  },
  cancelled: {
    type: Boolean,
    required: false,
  },
  version: {
    type: Number,
    required: true,
  },
  timetableType: {
    type: String,
    required: true,
  },
  timetableAcceptanceDate: Date,
  deleted: {
    type: Boolean,
    required: false,
  },
  timeTableRows: [{
    trainStopping: {
      type: Boolean,
      required: true,
    },
    stationShortCode: {
      type: String,
      required: true,
    },
    stationUICCode: {
      type: Number,
      required: true,
    },
    countryCode: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    commercialStop: {
      type: Boolean,
      required: false,
    },
    commercialTrack: {
      type: String,
      required: false,
    },
    cancelled: {
      type: Boolean,
      required: false,
    },
    scheduledTime: {
      type: Date,
      required: true,
    },
    liveEstimateTime: {
      type: Date,
      required: false,
    },
    estimateSource: {
      type: String,
      required: false,
    },
    unknownDelay: {
      type: Boolean,
      required: false,
    },
    actualTime: {
      type: Date,
      required: false,
    },
    differenceInMinutes: {
      type: Number,
      required: false,
    },
    passed: {
      type: Boolean,
      required: false,
    },
    causes: [{
      categoryCodeId: {
        type: Number,
        required: true,
      },
      categoryCode: {
        type: String,
        required: true,
      },
      detailedCategoryCodeId: {
        type: Number,
        required: false,
      },
      detailedCategoryCode: {
        type: String,
        required: false,
      },
      thirdCategoryCodeId: {
        type: Number,
        required: false,
      },
      thirdCategoryCode: {
        type: String,
        required: false,
      },
    }, ],
    trainReady: {
      source: {
        type: String,
        required: true,
      },
      accepted: {
        type: Boolean,
        required: true,
      },
      timestamp: {
        type: Date,
        required: true,
      },
    },
  }, ],
  compositions: [{
    beginTimetableRow: {
      stationShortCode: {
        type: String,
        required: true,
      },
      stationUICCode: {
        type: Number,
        required: true,
      },
      countryCode: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      scheduledTime: {
        type: Date,
        required: true,
      },
    },
    endTimetableRow: {
      stationShortCode: {
        type: String,
        required: true,
      },
      stationUICCode: {
        type: Number,
        required: true,
      },
      countryCode: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      scheduledTime: {
        type: Date,
        required: true,
      },
    },
    locomotives: [{
      location: {
        type: Number,
        required: true,
      },
      locomotiveType: {
        type: String,
        required: true,
      },
      powerType: {
        type: String,
        required: true,
      },
    }, ],
    wagons: [{
      location: {
        type: Number,
        required: true,
      },
      salesNumber: {
        type: Number,
        required: true,
      },
      length: {
        type: Number,
        required: false,
      },
      playground: {
        type: Boolean,
        required: false,
      },
      pet: {
        type: Boolean,
        required: false,
      },
      catering: {
        type: Boolean,
        required: false,
      },
      video: {
        type: Boolean,
        required: false,
      },
      luggage: {
        type: Boolean,
        required: false,
      },
      smoking: {
        type: Boolean,
        required: false,
      },
      disabled: {
        type: Boolean,
        required: false,
      },
      wagonType: {
        type: String,
        required: false,
      },
    }, ],
    totalLength: {
      type: Number,
      required: false,
    },
    maximumSpped: {
      type: Number,
      required: false,
    },
  }, ],
});
const Train = mongoose.model('Train', trainSchema);

// Asemien tietokantarakenne Mongoosea varten
const stationSchema = new mongoose.Schema({
  passangerTraffic: {
    type: Boolean,
    required: true,
  },
  countryCode: {
    type: String,
    required: true,
  },
  stationName: {
    type: String,
    required: true,
  },
  stationShortCode: {
    type: String,
    required: true,
  },
  stationUICCode: {
    type: Number,
    required: true,
  },
  latitudee: {
    type: Number,
    required: true,
  },
  longitude: {
    type: Number,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
});
const Station = mongoose.model('Station', stationSchema);

// Herätepisteiden tietokantarakenne Mongoosea varten
const ruleSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  trainRunningMessageTrackSection: {
    type: String,
    required: true,
  },
  trainRunningMessageStationShortCode: {
    type: String,
    required: true,
  },
  trainRunningMessageNextStationShortCode: {
    type: String,
    required: true,
  },
  trainRunningMessageType: {
    type: String,
    required: true,
  },
  timeTableRowStationShortCode: {
    type: String,
    required: true,
  },
  timeTableRowType: {
    type: String,
    required: true,
  },
  offset: {
    type: Number,
    required: true,
  },
});
const Rules = mongoose.model('Rules', ruleSchema);

// Arduinon tila, seurattava asema (alussa tyhjä), viimeisin lähetetty juna ja lista tilatuista aiheista
let mode = 'TRAIN';
let station = '';
let lastSentTrain = null;
let topics = [];

// Sarjaporttiyhteys ja rivijäsennin
const port = new SerialPort('COM3', {
  baudRate: 9600,
  autoOpen: false,
});
const parser = port.pipe(
  new Readline({
    delimiter: '\n',
  })
);

// MQTT-asiakas
const mqttClient = MQTT.connect('mqtt://rata-mqtt.digitraffic.fi:1883/', {
  port: 1883,
  clientId: 'mqttjs_' +
    Math.random()
    .toString(16)
    .substr(2, 8),
  protocolId: 'MQIsdp',
  protocolVersion: 3,
  clean: true,
  rejectUnauthorized: false,
  debug: true,
});

/*
 * Pääfumktio.
 */
async function start() {
  // Yhdistetään tietokantaan
  mongoose.connect('mongodb://localhost:27017/traintracker', {
    useNewUrlParser: true,
  });

  // Päivitetään liikennepaikat ja herätepisteet tietokantaan.
  if (initializeCollections) {
    try {
      await initialize();
    } catch (error) {
      console.error('Virhe alustuksessa:', error);
    }
  }

  port.open((err) => {
    if (err) {
      console.error('Sarjaporttia COM3 ei voitu avata:', err);
    }
  });

  mqttClient.on('connect', async () => {
    console.log('MQTT-yhteys Digitraffic Rataan muodostettu.');
  });

  // Arduino lähettää sarjaportissa dataa
  parser.on('data', async (data) => {
    console.log('Arduino lähetti:', data);
    const command = data.substring(0, data.length - 1).split('::');
    // Jos tilattuja aiheita on jo, poistetaan niiden tilaus.
    if (topics.length > 0) {
      await unsubscribeFromAllTopics();
      topics = [];
    }
    switch (command[0]) {
      case 'TRAIN':
        mode = 'TRAIN';
        topics.push(
          `train-tracking/+/${command[1]}/#`,
          `trains/+/${command[1]}/#`,
          `train-locations/+/${command[1]}`
        );
        await getTrain(command[1]);
        await subscribeToAllTopics();
        console.log(topics);
        await write(
          `TOK:${command[1]}:${train.commuterLineID ||
            train.trainType}: : : : : \n`
        );
        console.log(
          `Lähetettiin viesti: TOK:${command[1]}:${train.commuterLineID ||
            train.trainType}: : : : : `
        );
        break;
      case 'STATION':
        mode = 'STATION';
        const s = await Station.find({
          stationUICCode: command[1],
        });
        if (s.length === 1) {
          station = s[0];
          console.log(`Aseman lyhenne: ${station.stationShortCode}`);
          await write(`SOK:${station.stationName}: : : : : : \n`);
          console.log(`Sent message: SOK:${station.stationName}: : : : : : `);
          topics.push(
            `trains-by-station/${station.stationShortCode}`,
            `train-tracking/+/+/+/${station.stationShortCode}/#`
          );
          await subscribeToAllTopics();
        }
        break;
      default:
        // Komento ei vastannut mitään palvelimen komennoista.
        console.error('Arduino lähetti komennon, jota ei tunnistettu.');
        break;
    }
  });

  mqttClient.on('message', async (topic, message) => {
    const msg = JSON.parse(message.toString());
    if (mode === 'TRAIN') {
      if (topic.toString().indexOf('trains') !== -1) {
        // Päivitetään juna tietokannassa.
        await Train.updateOne({
            trainNumber: msg.trainNumber,
            departureDate: msg.departureDate
          },
          msg, {
            upsert: true
          }
        );
      } else if (topic.toString().indexOf('train-locations') !== -1) {
        // Päivitetään juna tietokannassa.
        await Train.updateOne({
          trainNumber: msg.trainNumber,
          departureDate: msg.departureDate
        }, {
          speed: msg.speed
        }, {
          upsert: true
        });
      } else {
        // const matchingRules = await Rules.find({ trainRunningMessageStationShortCode: msg.station, trainRunningMessageNextStationShortCode: msg.nextStation, trainRunningMessageTrackSection: msg.trackSection, trainRunningMessageType: msg.type });
        // if (matchingRules.length > 0) {
        /*
         * Jos liikennepaikalle saapumista ja lähtemistä ennustetaan herätepisteiden avulla, jostakin syystä toteutumaennusteet ovat epätarkempia kuin
         * jos luotetaan Digitrafficin COMBOCALC-ennusteeseen (tai jopa muihin ennustetyypeihin).
         *
         * let diff = 0;
         * if (matchingRules[0].offset >= 0) {
         *   diff = moment(msg.timestamp).add(matchingRules[0].offset, 'seconds');
         * } else {
         *   diff = moment(msg.timestamp).subtract(matchingRules[0].offset, 'seconds');
         * }
         *
         * diff = moment().diff(diff, 'seconds');
         *
         * await write(`TRA:${msg.trainNumber}:${train.commuterLineID || train.trainType}:${matchingRules[0].timeTableRowStationShortCode}:${matchingRules[0].timeTableRowType}:${diff}`);
         * console.log(`Sent message: TRA:${msg.trainNumber}:${train.commuterLineID || train.trainType}:${matchingRules[0].timeTableRowStationShortCode}:${diff}:${diff}`);
         * console.log('Rule:', matchingRules[0])
         *
         */
        if (msg.type === 'OCCUPY') {
          // Päivitetään juna tietokannassa.
          await Train.updateOne({
            trainNumber: msg.trainNumber,
            departureDate: msg.departureDate
          }, {
            runningMessage: {
              station: msg.station,
              trackSection: msg.trackSection,
              type: msg.type,
            },
          }, {
            upsert: true
          });
        }
      }
      // Tehdään tietokantaan aggregointikysely, joka palauttaa ensimmäisenä seuraavan sellaisen liikennepaikan, jolla ei ole toteumaa.
      /*
      const nextEstimate = await Train.aggregate([
        { $match: { trainNumber: `${msg.trainNumber}` } }, // trainNumber haluaisi olla Number, mutta tietokannassa ne tallennetaan String-muodossa
        { $unwind: '$timeTableRows' },
        { $match: { 'timeTableRows.actualTime': null } },
        {
          $sort: {
            'timeTableRows.scheduledTime': 1,
            'timeTableRows.liveEstimateTime': 1,
          },
        },
      ]);
      */
      /*
       * Yläpuolella näkyvä koodi on korvattu alemmalla. Jotkin liikennepaikat eivät tuota toteumatietoja (esim. Havukoski kaukojunilla,
       * Tampereella kirjaukset tehdään käsin jne.), jolloin
       * koodi ei voi luottaa siihen, että kaikki toteumatiedot ovat oikein.
       *
       * Tämä koodi hakee yksittäisen junan aggregointitoiminnon sijaan (koska emme ole todennäköisesti kiinnostuneita monesta junasta samaan aikaan)
       * ja Node-palvelimella tehdään päätös siitä, mikä on viimeisin toteumatieto. Rivit käydään läpi takaperin, jotta mahdolliset
       * toteumatietojen puutteet ohitettaisiin. Tämäkään ei ole pomminvarma ratkaisu, esim. Kouvola-Kotkan satama -rataosuudella
       * toteumatietoja ei käytännössä tule miltään liikennepaikalta, jolloin pitäisi turvautua esim. GPS:n antamiin tietoihin.
       */
      const trains = await Train.find({
        trainNumber: `${msg.trainNumber}`
      });
      const nextTrain = trains[0];
      const timetableRows = nextTrain.timeTableRows;
      const reverseTimetableRows = timetableRows.slice().reverse();
      // Array.findIndex palauttaa sen aikataulurivin indeksin, joka sisältää actualTime-tiedon, jos sitä ei ole millään rivillä, palautetaan -1,
      // jolloin juna ei ole vielä esim. lähtenyt origin-asemaltaan
      const lastActualTime = reverseTimetableRows.findIndex((el) => {
        return el.actualTime;
      });
      const nextEstimate = nextTrain;
      delete nextEstimate.timeTableRows;
      if (lastActualTime === -1) {
        nextEstimate.timeTableRows = timetableRows[0];
      } else if (lastActualTime === timetableRows.length) {
        nextEstimate.timeTableRows = timetableRows[timetableRows.length - 1];
      } else {
        nextEstimate.timeTableRows = timetableRows[timetableRows.length - lastActualTime];
        console.log(nextEstimate);
      }

      //if (nextEstimate.length > 0) {
      const index = 0;
      /*
      if (nextEstimate.length > 1) {
        console.log(`${msg.type}, ${nextEstimate[1].timeTableRows.type}, ${msg.station} on tai ei ole ${nextEstimate[1].timeTableRows.stationShortCode}`)
        if (msg.type === 'OCCUPY' && nextEstimate[1].timeTableRows.type === 'ARRIVAL' && msg.station !== nextEstimate[1].timeTableRows.stationShortCode) {
          console.log('Index is now 1!');
          index = 1;
          await Train.updateOne(
            { _id: nextEstimate[0]._id },
            { $set: { 'timeTableRows.$[element].passed': true } },
            { multi: true, arrayFilters: [{ 'element.stationShortCode': nextEstimate[0].stationShortCode }] }
          );
        }
      }
      */
      const send = {
        st: 'T',
        n: `${msg.trainNumber}`,
        l: nextEstimate.commuterLineID || nextEstimate.trainType,
        e: `${moment(nextEstimate.timeTableRows[0].liveEstimateTime).diff(
            moment(),
            'seconds'
          )}`,
        s: nextEstimate.runningMessage ? nextEstimate.runningMessage.station : ' ',
        ts: nextEstimate.runningMessage ? nextEstimate.runningMessage.trackSection : ' ',
        t: nextEstimate.runningMessage ? nextEstimate.runningMessage.type : ' ',
        sp: typeof nextEstimate.speed === 'number' ? `${nextEstimate.speed}` : '?', // Tässä oli videolla virhe.
      };
      const sendd = `T:${send.n}:${send.l}:${send.e}:${send.s}:${send.ts}:${
          send.t
        }:${send.sp}`;
      await write(sendd + '\n');
      console.log('Lähetettiin:', sendd);
      //}
    } else if (mode === 'STATION') {
      console.log(topic.toString());
      if (topic.toString().indexOf('trains-by-station' !== -1)) {
        await Train.updateOne({
            trainNumber: msg.trainNumber,
            departureDate: msg.departureDate
          },
          msg, {
            upsert: true
          }
        );
        const nextTrain = await Train.aggregate([{
            $unwind: '$timeTableRows'
          },
          {
            $match: {
              'timeTableRows.stationShortCode': station.stationShortCode,
              'timeTableRows.actualTime': null,
              // 'timeTableRows.passed': { $neq: true },
            },
          },
          {
            $sort: {
              'timeTableRows.scheduledTime': 1,
              'timeTableRows.liveEstimateTime': 1,
            },
          },
        ]);
        // Jos edellinen lähetetty juna ei ole sama kuin tietokannasta palautunut juna...
        // (vertailu tehdään lodash-kirjastolla)
        if (!_.isEqual(lastSentTrain, nextTrain[0])) {
          if (nextTrain.length > 0) {
            lastSentTrain = nextTrain[0];
            const nextTrainDoc = await Train.findById(nextTrain[0]._id);
            const type =
              nextTrain[0].timeTableRows.type === 'ARRIVAL' ? 'ARR' : 'DEP';
            const track = nextTrain[0].timeTableRows.commercialTrack || ' ';
            await write(
              `S:${nextTrain[0].trainNumber} ${
                nextTrainDoc.timeTableRows[0].stationShortCode
              }-${
                nextTrainDoc.timeTableRows[
                  nextTrainDoc.timeTableRows.length - 1
                ].stationShortCode
              }:${nextTrain[0].commuterLineID ||
                nextTrain[0].trainType}:${moment(
                nextTrain[0].timeTableRows.liveEstimateTime ||
                  nextTrain[0].timeTableRows.scheduledTime
              ).format('HH.mm.ss')}:${type}:${track}\n` // momentjs-kirjastolla voidaan muotoilla esim. ISO-muotoisesta päiväyksestä luettavampi
            );
            console.log(
              `Lähetettiin: S:${nextTrain[0].trainNumber}:${nextTrain[0]
                .commuterLineID || nextTrain[0].trainType}:${moment(
                nextTrain[0].timeTableRows.liveEstimateTime ||
                  nextTrain[0].timeTableRows.scheduledTime
              ).format('HH.mm.ss')}:${type}:${track}`
            );
          }
        }
      }
    }
  });
}

/*
 * Aloitetaan palvelinohjelman suorittaminen.
 */
start();

// Tilataan kaikki topics-taulukossa olevat aiheet.
function subscribeToAllTopics() {
  return new Promise((resolve, reject) => {
    mqttClient.subscribe(topics, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Poistetaan kaikki tilaukset, jotka ovat topic-taulukossa.
function unsubscribeFromAllTopics() {
  return new Promise((resolve, reject) => {
    mqttClient.unsubscribe(topics, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Kirjoitetaan sarjaporttiin.
function write(message) {
  return new Promise((resolve, reject) => {
    port.write(message, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Tällä saadaan "ennakkotieto" halutusta junasta. Axiosta käytetään HTTP-clienttinä.
async function getTrain(trainNumber) {
  try {
    const response = await axios.get(
      `https://rata.digitraffic.fi/api/v1/trains/latest/${trainNumber}`
    );
    if (response.data.length > 0) {
      await Train.updateOne({
          trainNumber: response.data[0].trainNumber,
          departureDate: response.data[0].departureDate,
        },
        response.data[0], {
          upsert: true
        }
      );
      train = response.data[0];
    } else {
      train = {};
    }
  } catch (error) {
    console.error(error);
  }
}

// Päivitetään tietokannan liikennepaikka- ja herätepistetiedot.
async function initialize() {
  try {
    const stations = await axios.get(
      `https://rata.digitraffic.fi/api/v1/metadata/stations`
    );
    const bulkOps = [];
    for (const station of stations.data) {
      bulkOps.push({
        updateOne: {
          filter: {
            stationUICCode: station.stationUICCode,
          },
          update: {
            ...station,
          },
          upsert: true,
        },
      });
    }
    const response = await Station.collection.bulkWrite(bulkOps, {
      ordered: false,
    });
    console.log('Asemalistaus päivitetty.');
  } catch (error) {
    console.error(error);
  }

  try {
    const rules = await axios.get(
      `https://rata.digitraffic.fi/api/v1/metadata/train-running-message-rules`
    );
    const bulkOps = [];
    for (const rule of rules.data) {
      bulkOps.push({
        updateOne: {
          filter: {
            id: rule.id,
          },
          update: {
            ...rule,
          },
          upsert: true,
        },
      });
    }
    const response = await Rules.collection.bulkWrite(bulkOps, {
      ordered: false,
    });
    console.log('Säännöt päivitetty.');
  } catch (error) {
    console.error(error);
  }
}