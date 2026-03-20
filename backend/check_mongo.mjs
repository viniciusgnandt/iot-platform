import mongoose from 'mongoose';

const mongoUri = 'mongodb+srv://viniciusgnandt_db_user:kk3KyRKh0ppv8j0S@univesp-pi-5.akx42mw.mongodb.net/?appName=univesp-pi-5';

try {
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('✅ Conectado ao MongoDB Atlas');
  
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  console.log('\n📚 Collections no MongoDB:');
  for (const col of collections) {
    const count = await db.collection(col.name).countDocuments();
    console.log(`  📊 ${col.name}: ${count} documentos`);
  }
  
  // Verificar sensorReadings especificamente
  console.log('\n🔍 Detalhes SensorReadings:');
  const readings = db.collection('sensorreadings');
  const count = await readings.countDocuments();
  console.log(`  Total: ${count} leituras`);
  
  if (count > 0) {
    const sample = await readings.findOne();
    console.log('\n  Amostra de sensor:');
    console.log(`    ID: ${sample.sensorId}`);
    console.log(`    Fonte: ${sample.source}`);
    console.log(`    Cidade: ${sample.location?.city || 'Não geocodificada'}`);
    console.log(`    PM2.5: ${sample.measurements?.pm25 || 'N/A'}`);
  }
  
  await mongoose.disconnect();
  console.log('\n✅ Verificação concluída');
} catch (err) {
  console.error('❌ Erro:', err.message);
  if (err.message.includes('IP')) {
    console.error('\n⚠️  MongoDB Atlas IP Whitelist não configurado!');
    console.error('   Adicione seu IP em: https://cloud.mongodb.com → Network Access');
  }
}
