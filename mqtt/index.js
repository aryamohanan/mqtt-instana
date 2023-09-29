const instana = require('@instana/collector');
instana(); // Initialize Instana for monitoring

const mqtt = require('mqtt');

// MQTT connection parameters
const mqttConfig = {
  host: 'broker.emqx.io',
  port: '1883',
  clientId: `mqtt_${Math.random().toString(16).slice(3)}`,
  connectUrl: 'mqtt://broker.emqx.io:1883',
  options: {
    clean: true,
    connectTimeout: 4000,
    username: 'emqx',
    password: 'public',
    reconnectPeriod: 1000,
  },
};

const client = mqtt.connect(mqttConfig.connectUrl, mqttConfig.options);

// Metadata for Instana monitoring
// This will be shown in the Instana UI.
const tags = {
  type: 'messaging',
  clientId: mqttConfig.clientId,
  package: 'mqtt',
};

const topic = '/nodejs/mqtt/in';
const topicOut = '/nodejs/mqtt/out';

client.on('connect', () => {
  // Delayed subscription after a successful connection
  setTimeout(() => {
    console.log('Connected');
    subscribe();
  }, 1000); 
});

client.on('message', async (receivedTopic, payload) => {
  // Start Instana entry span for MQTT message received
  await instana.sdk.async.startEntrySpan('MQTT message received', tags);
  console.log('Received Message:', receivedTopic, payload.toString());

  // Simulate an outgoing call (e.g., a database or HTTP call)
  // Replace this with your actual outgoing call logic
  // Start Instana exit span for outgoing call
  await instana.sdk.async.startExitSpan('Outgoing call', tags);
  await publish(); // Replace with your actual outgoing call
  instana.sdk.async.completeExitSpan();
  instana.sdk.async.completeEntrySpan();
});

function subscribe() {
  client.subscribe([topic], () => {
    try {
      console.log(`Subscribed to topic '${topic}'`);
      // Simulate publishing a message to the same topic
      client.publish(topic, 'nodejs mqtt incoming message', {
        qos: 0,
        retain: false,
      });
    } catch (publishError) {
      console.error('Error while publishing:', publishError);
    }
  });
}

async function publish() {
  console.log(`Publish to topic '${topicOut}'`);
  // Simulate publishing a message to an outbound topic
  await client.publish(topicOut, 'nodejs mqtt outgoing message', {
    qos: 0,
    retain: false,
  });
}
