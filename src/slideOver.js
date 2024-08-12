export class SlideOver {
    constructor(options = {
        open: { id: 'open_button', name: 'Open', background: 'bg-blue-500', fontColor: 'text-slate-100' },
        close: { id: 'close_button', name: 'Close' },
        card: { id: 'card', background: 'bg-slate-400' },
        body: { id: 'body', button: 2, name: [] }
    }) {
        this.options = options;
        this.createElements();
    }

    createElements() {
        for (const key in this.options) {
            if (this.options.hasOwnProperty(key)) {
                this.createElement(key, this.options[key]);
            }
        }
    }

    createElement(type, config) {
        let element;

        if (type === 'open') {
            const existingOpenElement = document.querySelector(`#${config.id}`);
            if (existingOpenElement) {
                existingOpenElement.remove();
            }

            element = document.createElement('button');
            element.innerText = config.name;
            element.className = 'z-[99999] absolute top-5 left-5 p-2 rounded';
            element.classList.add(config.background, config.fontColor);
            element.setAttribute('id', config.id);

            document.body.appendChild(element);

            element.addEventListener('click', () => {
                const card = document.querySelector(`#${this.options.card.id}`);
                if (card) {
                    if (card.classList.contains('-translate-x-full')) {
                        card.classList.remove('-translate-x-full');
                        card.classList.add('translate-x-0');
                    } else {
                        card.classList.remove('translate-x-0');
                        card.classList.add('-translate-x-full');
                    }
                } else {
                    console.error('Card element not found!');
                }
            });

        } else if (type === 'card') {
            const existingCardElement = document.querySelector(`#${config.id}`);
            if (existingCardElement) {
                existingCardElement.remove();
            }

            element = document.createElement('div');
            element.setAttribute('id', config.id);
            element.className = `c fixed top-0 left-0 w-1/2 h-full z-[99999] p-4 transform -translate-x-full transition-transform duration-300`;
            element.classList.add(config.background);

            document.body.appendChild(element);

        } else if (type === 'close') {
            setTimeout(() => {
                const card = document.querySelector(`#${this.options.card.id}`);
                if (card) {
                    const existingCloseButton = document.querySelector(`#${config.id}`);
                    if (existingCloseButton) {
                        existingCloseButton.remove();
                    }

                    const parent = document.createElement('div');
                    parent.className = 'w-full p-1 flex justify-end items-center';
                    card.insertBefore(parent, card.children[0]);

                    element = document.createElement('button');
                    element.innerText = config.name;
                    element.setAttribute('id', config.id);
                    parent.appendChild(element);

                    element.addEventListener('click', () => {
                        card.classList.add('-translate-x-full');
                        card.classList.remove('translate-x-0');
                    });
                } else {
                    console.error('Card element not found for close button!');
                }
            }, 100);
        } else if (type === 'body') {
            const card = document.querySelector(`#${this.options.card.id}`);
            if (card) {
                const parent = document.createElement('div');
                parent.className = "flex flex-col p-2";
                card.appendChild(parent);

                if (Array.isArray(config.name)) {
                    config.name.forEach((item, index) => {
                        const button = document.createElement('button');
                        button.innerText = item.name || `Button ${index + 1}`;
                        parent.appendChild(button);
                    });
                } else {
                    for (let index = 0; index < config.button; index++) {
                        const button = document.createElement('button');
                        button.innerText = `Button ${index + 1}`;
                        parent.appendChild(button);
                    }
                }
            } else {
                console.error('Card element not found for body buttons!');
            }
        }
    }

    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.createElements();
    }
}