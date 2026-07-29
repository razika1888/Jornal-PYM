(function () {
    // Coordenadas de Nova York
    const NY_LAT = 40.7128;
    const NY_LON = -74.006;

    const FORECAST_URL =
        'https://api.open-meteo.com/v1/forecast' +
        `?latitude=${NY_LAT}` +
        `&longitude=${NY_LON}` +
        '&current_weather=true' +
        '&timezone=America%2FNew_York';

    const WEATHER_CODE_PT = {
        0: 'limpo',
        1: 'poucas nuvens',
        2: 'parcialmente nublado',
        3: 'nublado',
        45: 'névoa',
        48: 'névoa com geada',
        51: 'garoa leve',
        53: 'garoa moderada',
        55: 'garoa densa',
        56: 'garoa congelante',
        57: 'garoa congelante densa',
        61: 'chuva leve',
        63: 'chuva moderada',
        65: 'chuva forte',
        66: 'chuva congelante',
        67: 'chuva congelante forte',
        71: 'neve leve',
        73: 'neve moderada',
        75: 'neve forte',
        77: 'grãos de neve',
        80: 'pancadas de chuva leves',
        81: 'pancadas de chuva moderadas',
        82: 'pancadas de chuva fortes',
        85: 'pancadas de neve leves',
        86: 'pancadas de neve fortes',
        95: 'trovoada',
        96: 'trovoada com granizo leve',
        99: 'trovoada com granizo forte'
    };

    document.addEventListener('DOMContentLoaded', () => {
        formatarData();
        renderNewYorkWeather();
    });

    // DATA
    function formatarData() {
        const el = document.querySelector('.top-bar__data');
        if (!el) return;

        const hoje = new Date();
        const formatador = new Intl.DateTimeFormat('pt-BR', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
        });

        // Formatação ex: 'Segunda-feira, 20 de julho'
        const dataFormatada = capitalizar(formatador.format(hoje));
        el.textContent = dataFormatada;
    }

    function capitalizar(texto) {
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    }

    // CLIMA DE NOVA YORK
    async function renderNewYorkWeather() {
        const el = document.querySelector('#temp-pym-city');
        if (!el) return;

        try {
            const resposta = await fetch(FORECAST_URL);
            if (!resposta.ok) {
                throw new Error(`Erro na resposta da API: ${resposta.status}`);
            }

            const dados = await resposta.json();
            const climaAtual = dados.current_weather;

            if (!climaAtual) {
                throw new Error('A API não retornou dados de clima atual.');
            }

            const temperatura = Math.round(climaAtual.temperature);
            const condicao = WEATHER_CODE_PT[climaAtual.weathercode] || 'condição indisponível';

            el.textContent = `${temperatura}°C, ${condicao}`;
        } catch (erro) {
            console.error('Não foi possível carregar o clima de Nova York:', erro);
            el.textContent = 'clima indisponível';
        }
    }
})();