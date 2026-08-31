import '@styles/index.scss';
let rootElement = document.querySelector('[data-root]');
let rootSection = rootElement.querySelector('[data-card-list]');
let modalList = rootElement.querySelectorAll('dialog[data-modal]');
let activeState = null;

const INITIAL_STATE = [
    {
        id: crypto.randomUUID(), type: 'main',
        countryCode: 'ch', countryName: 'Швейцария',
        panelLink: '#',
    },

    {
        id: crypto.randomUUID(), type: 'main',
        countryCode: 'se', countryName: 'Швеция',
        panelLink: '#',
    },

    {
        id: crypto.randomUUID(), type: 'main',
        countryCode: 'us', countryName: 'США',
        panelLink: '#',
    },

    {
        id: crypto.randomUUID(), type: 'test',
        countryCode: 'ch', countryName: 'Швейцария',
        panelLink: '#',
    },
];

function getInitialState(storageKey, fallbackState) {
    let savedState = localStorage.getItem(storageKey);
    return savedState ? JSON.parse(savedState) : fallbackState;
}

function fabricCard(data, rootEl) {
    let templateCard = rootEl.querySelector(`template[data-template-card="${data.type}"]`);
    if (!templateCard) return null;

    let cardElement = templateCard.content.cloneNode(true);
    let rootElementCard = cardElement.querySelector('[data-card-type]');

    let titleCard = rootElementCard.querySelector('[data-info="title"]');
    let iconCard = rootElementCard.querySelector('[data-info="icon"]');
    let x3PanelCard = rootElementCard.querySelector('[data-button="redirect-panel"]');

    if (titleCard && iconCard && x3PanelCard) {
        titleCard.textContent = `${data.countryCode.toUpperCase()} ${data.countryName}`;
        iconCard.setAttribute('href', `./sprites.svg#flag-${data.countryCode.toLowerCase()}`);
        x3PanelCard.setAttribute('href', data.panelLink);
    }

    if (data.type === 'main') {
        let hostCard = rootElementCard.querySelector('[data-info="host"]');
        let portCard = rootElementCard.querySelector('[data-info="port"]');

        hostCard.after(` ${data.host}`);
        portCard.after(` ${data.port}`);
    }

    return cardElement;
}

function toggleModal(rootEl) {
    rootEl.addEventListener('click', (e) => {
        let targetCard = e.target.closest('[data-card-type]');

        if (e.target.dataset.modalOpen) {
            let modalKey = e.target.getAttribute('data-modal-open');
            let settingMenu = targetCard.querySelector('[data-card="open-setting"]');

            modalList.forEach(element => {
                if (modalKey === element.dataset.modal) {
                    let closeButton = element.querySelector('[data-modal="close"]');

                    element.showModal();
                    settingMenu.removeAttribute('open');
                    closeButton.addEventListener('click', () => {
                        element.close();
                    })
                } return;
            })
        }
    })
}

function renderingView(data) {
    data.forEach(element => {
        const card = fabricCard(element, rootSection);

        if (card) {
            rootSection.append(card);
        }
    });
}

function initApp() {
    let state = getInitialState('all_cards', INITIAL_STATE);

    if (!localStorage.getItem('all_cards')) {
        localStorage.setItem('all_cards', JSON.stringify(state));
    };

    activeState = state;
    renderingView(activeState);
    toggleModal(rootSection);
}

initApp();