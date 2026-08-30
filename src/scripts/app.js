import '@styles/index.scss';
let rootElement = document.querySelector('[data-root]');
let rootSection = rootElement.querySelector('[data-card-list]');
let modalList = rootElement.querySelectorAll('dialog[data-modal]');
let activeState = null;

const TAB_ITEM_SELECTOR = '[data-tab-element]';
const FOCUSABLE_SELECTOR = 'a[href], button, input, select, textarea, [tabindex]';
const isDisabled = (el) => el.disabled === true || el.getAttribute('aria-disabled') === 'true';
const isVisible = (el) => el.getClientRects().length > 0;
const wrapIndex = (index, length) => ((index % length) + length) % length;

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
        iconCard.setAttribute('href', `/sprites.svg#flag-${data.countryCode}`);
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

// Все участники табуляции внутри контейнера, в порядке документа
function getTabItems(root) {
    return Array.from(root.querySelectorAll(TAB_ITEM_SELECTOR))
        .filter((el) => isVisible(el) && !isDisabled(el));
}

// Ближайший родитель-участник (null = верхний уровень контейнера)
function getTabOwner(el, root) {
    const owner = el.parentElement?.closest(TAB_ITEM_SELECTOR) ?? null;
    return owner && owner !== root && root.contains(owner) ? owner : null;
}

// Соседи по уровню = у кого тот же owner
function getTabSiblings(items, el, root) {
    const owner = getTabOwner(el, root);
    return items.filter((item) => getTabOwner(item, root) === owner);
}

// Фокус на сам элемент, либо на первый фокусируемый внутри него
function focusTabItem(el) {
    let target = el.matches(FOCUSABLE_SELECTOR) ? el : el.querySelector(FOCUSABLE_SELECTOR) ?? el;
    if (!target.matches(FOCUSABLE_SELECTOR)) target.tabIndex = -1;
    target.focus();
}

function initCustomTabNavigation(root, { loop = false } = {}) {
    if (!root) return;

    root.addEventListener('keydown', (event) => {
        if (event.ctrlKey || event.metaKey) return;

        let step = 0;
        let scoped = false; // true = ходим только по своему уровню

        if (event.key === 'Tab' && !event.altKey) {
            step = event.shiftKey ? -1 : 1;
        } else if (event.altKey && !event.shiftKey) {
            scoped = true;
            switch (event.code) {          // code, а не key: работает на любой раскладке
                case 'KeyA': step = -1; break;
                case 'KeyX': step = 2; break;
                case 'KeyZ': step = -2; break;
                default: return;
            }
        } else {
            return;
        }

        const items = getTabItems(root);
        if (!items.length) return;

        // если фокус на инпуте внутри обёртки — поднимаемся до участника
        const current = document.activeElement?.closest?.(TAB_ITEM_SELECTOR);

        if (!current || !items.includes(current)) {
            event.preventDefault();
            focusTabItem(step > 0 ? items[0] : items[items.length - 1]);
            return;
        }

        const list = scoped ? getTabSiblings(items, current, root) : items;
        const nextIndex = list.indexOf(current) + step;

        // Tab без зацикливания на границе — отдаём браузеру, чтобы уйти из блока
        if (!scoped && !loop && (nextIndex < 0 || nextIndex >= list.length)) return;

        event.preventDefault(); // заодно глушим системное меню по Alt
        focusTabItem(list[wrapIndex(nextIndex, list.length)]);
    });
}

 function handleCustomTab(data) {
  if (!data) return;

  data.addEventListener('keydown', (event) => {
    const isAlt = event.altKey && !event.shiftKey && !event.ctrlKey;
    const isOnlyTab = event.key === 'Tab' && !event.shiftKey && !event.ctrlKey && !event.altKey;

    if (!isAlt && event.key !== 'Tab') return;

    const tabulationElements = Array.from(data.querySelectorAll('[data-tab-element]'));
    const totalElements = tabulationElements.length;
    if (totalElements === 0) return;

    const activeTabElement = document.activeElement;
    const currentTabIndex = tabulationElements.indexOf(activeTabElement);

    if (isOnlyTab) {
      if (currentTabIndex === totalElements - 1) {
        event.preventDefault();
        tabulationElements[0].focus();
      }
      return;
    }

    let tabulationStep = 0;
    switch (event.code) {
      case 'KeyA': tabulationStep = -1; break;
      case 'KeyX': tabulationStep = 2; break;
      case 'KeyZ': tabulationStep = -2; break;
      default: return;
    }

    event.preventDefault();
    if (currentTabIndex === -1) {
      tabulationElements[0].focus();
      return;
    }

    const currentType = activeTabElement.getAttribute('data-tab-element');

    if (currentType === 'wrapper' || activeTabElement.closest('.modal__flag-grid') && currentType !== 'button') {
      const wrappers = tabulationElements.filter(el => el.getAttribute('data-tab-element') === 'wrapper');
      if (wrappers.length > 0) {
        const currentWrapperIndex = wrappers.indexOf(activeTabElement);
        const nextWrapperIndex = (currentWrapperIndex + (tabulationStep > 0 ? 1 : -1) % wrappers.length + wrappers.length) % wrappers.length;
        wrappers[nextWrapperIndex].focus();
      }
    } else {
      const currentGroup = activeTabElement.closest('.flag-group');
      
      let scopeElements = tabulationElements;
      let indexInScope = currentTabIndex;

      if (currentGroup) {
        scopeElements = Array.from(currentGroup.querySelectorAll('[data-tab-element]'));
        indexInScope = scopeElements.indexOf(activeTabElement);
      }

      if (scopeElements.length > 0) {
        const nextScopeIndex = (indexInScope + tabulationStep % scopeElements.length + scopeElements.length) % scopeElements.length;
        scopeElements[nextScopeIndex].focus();
      }
    }
  });
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
    document.querySelectorAll('[data-tab-root]').forEach((root) => {
        initCustomTabNavigation(root, { loop: root.hasAttribute('data-tab-loop') });
    });
}

initApp();