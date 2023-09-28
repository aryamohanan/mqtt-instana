const instana = require('@instana/collector');
instana();
const mqtt = require('mqtt');
//free public MQTT broker at broker.emqx.io
const host = 'broker.emqx.io';
const port = '1883';
const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;

const connectUrl = `mqtt://${host}:${port}`;

const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  username: 'emqx',
  password: 'public',
  reconnectPeriod: 1000,
});
const info = {
  type: 'messaging',
  clientId: clientId,
  package: 'mqtt',
};
const topic = '/nodejs/mqtt';

client.on('connect', async () => {
  setTimeout(async () => {
    console.log('Connected');
    await subscribe();
  }, 1000);
});

client.on('message', async (topic, payload) => {
  await instana.sdk.async.startEntrySpan('MQTT message received', info);
  console.log('Received Message:', topic, payload.toString());
  instana.sdk.async.completeEntrySpan();
});
async function subscribe() {
  client.subscribe([topic], async () => {
    try {
      console.log(`Subscribe to topic '${topic}'`);
      client.publish(topic, 'nodejs mqtt test', { qos: 0, retain: false });
    } catch (publishError) {
      console.error('Error while publishing:', publishError);
    }
  });
}
