// src/pages/SensorExplainer.jsx
// Comprehensive guide about sensors and types

import { StatCard } from '../components/ui/index.jsx';

/** Sensor type card */
function SensorTypeCard({ icon, name, model, description, measurements, manufacturer, cost }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4 mb-4">
        <div className="text-4xl">{icon}</div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg">{name}</h3>
          <p className="text-xs text-gray-500 mt-1">Modelo: <span className="font-mono">{model}</span></p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">{description}</p>

      <div className="space-y-2 mb-4">
        <div>
          <span className="text-xs font-semibold text-gray-700 uppercase">Mede:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {measurements.map(m => (
              <span key={m} className="inline-block bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
                {m}
              </span>
            ))}
          </div>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-700 uppercase">Fabricante:</span>
          <p className="text-sm text-gray-600 mt-0.5">{manufacturer}</p>
        </div>
        <div>
          <span className="text-xs font-semibold text-gray-700 uppercase">Custo estimado:</span>
          <p className="text-sm text-gray-600 mt-0.5">{cost}</p>
        </div>
      </div>
    </div>
  );
}

/** Measurement info card */
function MeasurementInfoCard({ icon, name, unit, range, accuracy, importance }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h4 className="font-semibold text-gray-900">{name}</h4>
          <p className="text-xs text-gray-500">{unit}</p>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between border-b border-gray-100 pb-2">
          <span className="text-gray-600">Faixa típica:</span>
          <span className="font-mono font-semibold text-gray-800">{range}</span>
        </div>
        <div className="flex justify-between border-b border-gray-100 pb-2">
          <span className="text-gray-600">Precisão:</span>
          <span className="font-mono font-semibold text-gray-800">{accuracy}</span>
        </div>
        <div>
          <span className="text-gray-600 block mb-1">Importância:</span>
          <p className="text-gray-600">{importance}</p>
        </div>
      </div>
    </div>
  );
}

export default function SensorExplainer() {
  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100 p-8 md:p-12">
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            O que são Sensores IoT?
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            <strong>IoT</strong> significa <em>Internet of Things</em> (Internet das Coisas).
            Sensores IoT são dispositivos eletrônicos que medem variáveis ambientais e as transmitem
            pela internet para serem analisadas em tempo real.
          </p>
          <p className="text-gray-600">
            A plataforma EcoSense coleta dados de sensores distribuídos em cidades do mundo inteiro,
            unificando informações sobre qualidade do ar, temperatura, umidade e vento para calcular
            o índice ICAU-D.
          </p>
        </div>
      </div>

      {/* How sensors work */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Como Sensores Funcionam</h2>

        <div className="bg-white rounded-xl border border-gray-100 p-8">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">
                🔬
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">1. Medição</h3>
                <p className="text-gray-600">
                  O sensor detecta uma variável física (temperatura, umidade, particulas de ar)
                  usando circuitos eletrônicos especializados.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-xl">
                📊
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">2. Conversão</h3>
                <p className="text-gray-600">
                  O sinal analógico é convertido para digital (0-1023 ou similar) por um microcontrolador.
                  Dados são calibrados para a unidade correta (°C, %, µg/m³, m/s).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl">
                📡
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">3. Transmissão</h3>
                <p className="text-gray-600">
                  Os dados são enviados via WiFi, GPRS, LoRaWAN ou outro protocolo de rede
                  para um servidor na internet (OpenSenseMap, Sensor.Community, etc).
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center text-xl">
                ☁️
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">4. Armazenamento</h3>
                <p className="text-gray-600">
                  Os servidores armazenam os dados em bancos de dados. A EcoSense acessa essas APIs
                  públicas para coletar os dados em tempo real.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-xl">
                📈
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">5. Análise</h3>
                <p className="text-gray-600">
                  A plataforma processa os dados, calcula o índice ICAU-D, agrega por cidade,
                  e exibe em mapas, gráficos e rankings para o usuário final.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sensor types used in EcoSense */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Tipos de Sensores na EcoSense</h2>
        <p className="text-gray-600 mb-6">
          A plataforma usa dados de 3 redes públicas diferentes, cada uma com seus próprios tipos de sensores:
        </p>

        <div className="space-y-6">
          {/* OpenSenseMap */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📦</span> OpenSenseMap — senseBox
            </h3>
            <SensorTypeCard
              icon="📦"
              name="senseBox MCU (v2)"
              model="senseBox:home"
              description="Kit educacional modular para monitoramento ambiental. Bastante popular na Europa, especialmente em escolas e universidades. Permite adicionar múltiplos sensores em uma única caixa."
              measurements={['Temperatura', 'Umidade', 'Pressão', 'PM2.5', 'PM10', 'CO2', 'Luz']}
              manufacturer="senseBox Team / Universidade de Münster"
              cost="€100-150 (DIY) ou €200-300 (pré-montado)"
            />
          </div>

          {/* Sensor.Community */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🌍</span> Sensor.Community — Luftdaten / NOVA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SensorTypeCard
                icon="💨"
                name="Nova SDS011"
                model="SDS011"
                description="Sensor de qualidade do ar por dispersão laser. Detecta particulas finas com alta precisão. Muito popular em redes comunitárias de baixo custo."
                measurements={['PM2.5', 'PM10']}
                manufacturer="Nova Fitness"
                cost="€20-30"
              />
              <SensorTypeCard
                icon="💧"
                name="DHT22"
                model="DHT22"
                description="Sensor de temperatura e umidade relativa. Combina com SDS011 em muitas estações Sensor.Community para medir 4 variáveis."
                measurements={['Temperatura', 'Umidade']}
                manufacturer="Aosong"
                cost="€5-10"
              />
            </div>
          </div>

          {/* OpenWeather */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>⛅</span> OpenWeather — Estações Meteorológicas
            </h3>
            <SensorTypeCard
              icon="⛅"
              name="Estações Meteorológicas Profissionais"
              model="Vários (Davis, Vaisala, etc)"
              description="Sensores de qualidade profissional instalados por agências meteorológicas, aeroportos e estações científicas. Dados usados como fallback quando poucos sensores comunitários disponíveis."
              measurements={['Temperatura', 'Umidade', 'Pressão', 'Vento', 'Precipitação']}
              manufacturer="Davis Instruments, Vaisala, etc"
              cost="€1000+ (profissional)"
            />
          </div>
        </div>
      </div>

      {/* Measurement specifications */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Especificações das Medições</h2>
        <p className="text-gray-600 mb-6">
          Entenda os ranges, precisões e importância de cada variável medida:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MeasurementInfoCard
            icon="🌡️"
            name="Temperatura"
            unit="Celsius (°C)"
            range="-50°C a +60°C"
            accuracy="±0.5°C a ±2°C"
            importance="Sensível a localização. Varia muito com sombra/sol. Ideal é 22°C para conforto humano."
          />
          <MeasurementInfoCard
            icon="💧"
            name="Umidade Relativa"
            unit="Porcentagem (%)"
            range="0% a 100%"
            accuracy="±2% a ±5%"
            importance="Indica conforto térmico. Muito seca (<30%) resseca pele. Muito úmida (>70%) favorece mofo."
          />
          <MeasurementInfoCard
            icon="🌫️"
            name="PM2.5"
            unit="Microgramas/m³ (µg/m³)"
            range="0 a 1000+ µg/m³"
            accuracy="±10% a ±30% (depende do sensor)"
            importance="Particulas finas que penetram pulmões profundos. Principal indicador de qualidade do ar urbano."
          />
          <MeasurementInfoCard
            icon="💨"
            name="Velocidade do Vento"
            unit="Metros/segundo (m/s)"
            range="0 a 30+ m/s"
            accuracy="±0.3 m/s a ±1 m/s"
            importance="Afeta percepção de temperatura (windchill). Vento dispersa poluentes ou os acumula."
          />
        </div>
      </div>

      {/* Sensor maintenance and accuracy */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Manutenção e Precisão</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">🔧 Manutenção Necessária</h3>
            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
              <li><strong>Limpeza:</strong> Sensores PM podem acumular poeira — limpeza a cada 3-6 meses</li>
              <li><strong>Calibração:</strong> Sensores de PM podem desvia com o tempo — recalibração anual recomendada</li>
              <li><strong>Atualizações:</strong> Firmware/software pode ser atualizado para melhorar precisão</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">⚠️ Limitações</h3>
            <ul className="space-y-2 text-sm text-gray-600 ml-4 list-disc">
              <li><strong>Sensores comunitários:</strong> Menor precisão (~10-30%) que estações profissionais (~2-5%)</li>
              <li><strong>Localização:</strong> Um sensor em uma rua movimentada ≠ sensor em parque — geograficamente representativo</li>
              <li><strong>Variabilidade:</strong> Temperatura muda com hora do dia, sol, sombra. Leituras instantâneas podem não ser representativas</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-2">✅ Validação de Dados</h3>
            <p className="text-sm text-gray-600">
              A EcoSense filtra sensores com dados inválidos (ex: temperatura -99°C, umidade 999%).
              Sensores que não reportam dados há >2 horas são marcados como inativos. Dados agregados por cidade
              usam média aritmética, então um sensor com leitura errada afeta menos cidades com muitos sensores.
            </p>
          </div>
        </div>
      </div>

      {/* Learning resources */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Recursos para Aprender Mais</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📦 OpenSenseMap</h3>
            <p className="text-sm text-gray-600 mb-3">
              Plataforma oficial para criar senseBoxes e explorar dados de sensores educacionais.
            </p>
            <a href="https://opensensemap.org" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
              opensensemap.org →
            </a>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">🌍 Sensor.Community</h3>
            <p className="text-sm text-gray-600 mb-3">
              Comunidade global de voluntários monitorando qualidade do ar com sensores de baixo custo.
            </p>
            <a href="https://sensor.community" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
              sensor.community →
            </a>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">📊 Documentação de APIs</h3>
            <p className="text-sm text-gray-600 mb-3">
              Como acessar dados das redes públicas programaticamente via REST APIs.
            </p>
            <div className="space-y-1">
              <a href="https://api.opensensemap.org/docs" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-sm font-medium">
                OpenSenseMap API →
              </a>
              <a href="https://github.com/opendata-stuttgart/meta/wiki/APIs" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline text-sm font-medium">
                Sensor.Community API →
              </a>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">🔬 Ciência Cidadã</h3>
            <p className="text-sm text-gray-600 mb-3">
              Como montar seu próprio sensor e contribuir para monitoramento ambiental.
            </p>
            <a href="https://participer.ecoconsciousness.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm font-medium">
              Guia de DIY →
            </a>
          </div>
        </div>
      </div>

      {/* Call to action */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-100 p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Quer Contribuir?</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Se você tem interesse em monitoramento ambiental, considere instalar um sensor em sua região.
          Qualquer pessoa pode criar uma senseBox ou sensor Luftdaten e contribuir com dados para a comunidade.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a href="https://opensensemap.org/add-kit" target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
            Criar uma senseBox
          </a>
          <a href="https://sensor.community/en/" target="_blank" rel="noopener noreferrer" className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
            Instalar Sensor.Community
          </a>
        </div>
      </div>
    </div>
  );
}
