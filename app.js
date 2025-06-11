document.addEventListener('DOMContentLoaded', async () => {
    const manicuresContainer = document.getElementById('manicures-container');
    const clienteId = getClienteId(); // Implemente conforme sua autenticação

    try {
        // Simulação: Busca requisições agrupadas por manicure
        const requisicoesPorManicure = await fetchRequisicoesAgrupadas(clienteId);
        
        if (requisicoesPorManicure.length === 0) {
            manicuresContainer.innerHTML = '<div class="empty-message">Nenhuma requisição encontrada</div>';
            return;
        }

        renderManicuresWithRequests(requisicoesPorManicure);
        setupFeedbackHandlers();
    } catch (error) {
        console.error('Erro:', error);
        manicuresContainer.innerHTML = '<div class="error-message">Erro ao carregar requisições</div>';
    }
});

// Função para buscar requisições agrupadas por manicure
async function fetchRequisicoesAgrupadas(clienteId) {
    // Na prática, substitua por uma chamada real ao seu backend
    // Exemplo de endpoint: GET /api/clientes/{clienteId}/requisicoes-agrupadas
    const response = await fetch(`/api/clientes/${clienteId}/requisicoes-agrupadas`);
    
    if (!response.ok) throw new Error('Erro ao buscar requisições');
    return await response.json();
    
    /* Exemplo de resposta esperada:
    [
        {
            manicure: {
                id: 1,
                nome: "Maria Silva",
                foto: "url-da-foto.jpg",
                servicos: ["Manicure", "Pedicure"],
                cidade: "Picos-PI",
                bairro: "Centro"
            },
            requisicoes: [
                {
                    id: 101,
                    data: "2023-06-15T14:00:00",
                    horaInicio: "14:00",
                    horaFim: "15:00",
                    status: "FINALIZADO",
                    feedback: null
                },
                ...
            ]
        },
        ...
    ]
    */
}

function renderManicuresWithRequests(manicuresData) {
    const container = document.getElementById('manicures-container');
    container.innerHTML = '';

    manicuresData.forEach(({ manicure, requisicoes }) => {
        const manicureCard = document.createElement('div');
        manicureCard.className = 'manicure-card';
        
        manicureCard.innerHTML = `
            <div class="manicure-header">
                <img src="${manicure.foto || 'https://via.placeholder.com/60'}" 
                     alt="${manicure.nome}" class="manicure-photo">
                <div class="manicure-info">
                    <h3>${manicure.nome}</h3>
                    <p>${manicure.servicos.join(' • ')}</p>
                    <p>${manicure.cidade} - ${manicure.bairro}</p>
                </div>
            </div>
            <div class="requests-list">
                ${requisicoes.map(req => createRequestHtml(req)).join('')}
            </div>
        `;
        
        container.appendChild(manicureCard);
    });
}

function createRequestHtml(request) {
    const date = new Date(request.data);
    const dateStr = date.toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
    });

    let feedbackHtml = '';
    if (request.status === 'FINALIZADO' && !request.feedback) {
        feedbackHtml = `
            <div class="feedback-section visible">
                <h4>Avalie o serviço:</h4>
                <div class="rating" data-request-id="${request.id}">
                    ${[1, 2, 3, 4, 5].map(i => 
                        `<span class="star" data-value="${i}">★</span>`
                    ).join('')}
                </div>
                <textarea placeholder="Como foi seu atendimento?"></textarea>
                <button class="submit-feedback">Enviar Avaliação</button>
            </div>
        `;
    }

    return `
        <div class="request-item" data-request-id="${request.id}">
            <div class="request-date">${dateStr}</div>
            <div class="request-time">${request.horaInicio} às ${request.horaFim}</div>
            <div class="status status-${request.status.toLowerCase()}">${request.status}</div>
            ${feedbackHtml}
        </div>
    `;
}

function setupFeedbackHandlers() {
    document.addEventListener('click', (e) => {
        // Avaliação por estrelas
        if (e.target.classList.contains('star')) {
            const stars = e.target.parentElement.querySelectorAll('.star');
            const value = parseInt(e.target.dataset.value);
            
            stars.forEach((star, index) => {
                star.classList.toggle('selected', index < value);
            });
        }
        
        // Envio de feedback
        if (e.target.classList.contains('submit-feedback')) {
            const requestItem = e.target.closest('.request-item');
            submitFeedback(requestItem);
        }
    });
}

async function submitFeedback(requestItem) {
    const requestId = requestItem.dataset.requestId;
    const stars = requestItem.querySelectorAll('.star.selected').length;
    const comment = requestItem.querySelector('textarea').value;

    if (!stars) {
        alert('Por favor, selecione uma avaliação');
        return;
    }

    try {
        // Envia para o backend
        const response = await fetch(`/api/requisicoes/${requestId}/feedback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avaliacao: stars, comentario: comment })
        });

        if (!response.ok) throw new Error('Erro ao enviar feedback');

        // Atualiza a UI
        requestItem.querySelector('.feedback-section').innerHTML = `
            <p style="text-align: center; color: green;">Obrigado pelo seu feedback!</p>
        `;
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao enviar avaliação. Tente novamente.');
    }
}

function getClienteId() {
    // Implemente conforme seu sistema de autenticação
    // Exemplo: pegar de localStorage, cookie ou token JWT
    return localStorage.getItem('userId');
}