class DealFetcher {
    constructor() {
        this.currentPage = 1;
        this.nextPageExists = true;
        this.itemsPerPage = 15;
        this.stores = [
            { storeID: 1, storeName: "Steam" },
            { storeID: 25, storeName: "Epic" },
            { storeID: 13, storeName: "Uplay" },
            { storeID: 11, storeName: "Humble Bundle" },
            { storeID: 8, storeName: "Origin" },
            { storeID: 31, storeName: "Blizzard" }
        ];
        this.init();
    }

    // Initial setup
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupEventListeners();
            this.createPaginationControls();
            this.fetchDeals();
            this.updateHeader();
        });
    }

    // Setup all event listeners
    setupEventListeners() {
        const elementsWithInputListener = ['minPrice', 'maxPrice'];
        elementsWithInputListener.forEach(id => this.setupPriceInputListeners(id));
        this.setupSearchInputListener();

        document.getElementById('filterSelect').addEventListener('change', () => this.resetAndFetchDeals());
        document.getElementById('search-button').addEventListener('click', () => this.resetAndFetchDeals());

        // Mobile navigation buttons
        document.getElementById('mobile-prev').addEventListener('click', () => this.changePage(this.currentPage - 1));
        document.getElementById('mobile-next').addEventListener('click', () => this.changePage(this.currentPage + 1));

        // Store buttons event listeners
        const storeButtons = document.querySelectorAll('.storeButton');
        const allStoresButton = document.querySelector('.allButton');

        storeButtons.forEach(button => {
            // button.classList.add('pressed');
            button.addEventListener('click', () => {
                button.classList.toggle('pressed');
                const allSelected = this.checkIfAllStoresPressed();
                allStoresButton.classList.toggle('pressed', allSelected)
                this.updateHeader();
                this.resetAndFetchDeals();
            });
        });

        if(allStoresButton) {
            // allStoresButton.classList.add('pressed'); // Ensure 'All Stores' is selected by default
            allStoresButton.addEventListener('click', () => {
                const isAllPressed = this.checkIfAllStoresPressed();
                allStoresButton.classList.toggle('pressed');
                storeButtons.forEach(button => button.classList.toggle('pressed', !isAllPressed));
                this.updateHeader();
                this.resetAndFetchDeals();
            });
        }
    }  

    setupPriceInputListeners(inputId) {
        const inputElement = document.getElementById(inputId);
        let originalValue = inputElement.value;

        inputElement.addEventListener('blur', () => {
            if (inputElement.value !== originalValue) {
                this.resetAndFetchDeals();
                originalValue = inputElement.value;
            }
        });
    }

    setupSearchInputListener() {
        const searchInput = document.getElementById('search-query');
        searchInput.addEventListener('blur', () => {
            this.resetAndFetchDeals();
        });
    }

    checkIfAllStoresPressed() {
        const storeButtons = document.querySelectorAll('.storeButton');
        return Array.from(storeButtons).every(button => button.classList.contains('pressed'));
    }
    
    updateHeader() {
        const storeHeader = document.getElementById('platform-header');
        const pressedButtons = document.querySelectorAll('.storeButton.pressed');
    
        if (pressedButtons.length === 1) {
            const storeName = pressedButtons[0].innerText;
            storeHeader.innerText = storeName;
        } else if (this.checkIfAllStoresPressed() || pressedButtons.length === 0) {
            storeHeader.innerText = 'All Stores';
        } else {
            storeHeader.innerText = 'Multiple Stores';
        }
    }

    resetAndFetchDeals() {
        this.currentPage = 1;
        this.fetchDeals();
        this.createPaginationControls();
    }

    // Fetch deals from the API
    fetchDeals() {
        const url = this.buildApiUrl();
        fetch(url)
            .then(res => res.json())
            .then(data => {
                this.handleFetchedData(data);
            })
            .catch(err => console.error('Error fetching deals:', err));
    }

    handleFetchedData(data) {
        if (data.length === 0) {
            this.nextPageExists = false;
            document.getElementById('deals-container').textContent = 'No deals available with selected filters.';
        } else {
            this.nextPageExists = true;
            this.displayDeals(data); // Pass the data directly to `displayDeals`
        }
    }

    // Construct API URL based on filters
    buildApiUrl() {
        // Base URL for the API
        const baseUrl = "https://www.cheapshark.com/api/1.0/deals";
        const minPrice = document.getElementById('minPrice').value || 0;
        let maxPrice = document.getElementById('maxPrice').value || 50;
        const gameTitle = document.getElementById('search-query').value || '';
        const selectedSortCriteria = document.getElementById('filterSelect').value || 'Deal Rating';

        // Collect IDs of pressed store buttons
        const pressedStoreButtons = Array.from(document.querySelectorAll('.storeButton.pressed'))
        .map(button => button.getAttribute('data-value'));

        let storeIDParams = pressedStoreButtons.join(',');

        // If no store buttons are pressed, include all store IDs by default
        if (pressedStoreButtons.length === 0) {
            storeIDParams = this.stores.map(store => store.storeID).join(',');
        }

        // Construct query params
        const queryParams = new URLSearchParams({
            lowerPrice: minPrice,
            upperPrice: maxPrice,
            title: gameTitle,
            exact: 0,
            sortBy: selectedSortCriteria,
            pageNumber: this.currentPage - 1,
            pageSize: 15,
            onSale: 1
        }).toString();

        return `${baseUrl}?storeID=${storeIDParams}&${queryParams}`;
    }

    // Display deals in the DOM
    displayDeals(data) {
        const dealsContainer = document.getElementById('deals-container');
        dealsContainer.innerHTML = ''; // Clear existing deals
    
        const gameTitle = document.getElementById('search-query').value.toLowerCase();

        data.forEach(deal => {
            if (!deal.title.toLowerCase().includes(gameTitle)) {
                console.log(`${deal.title} doesn't include title entered`);
                data.splice(data.indexOf(deal), 1);
                return;
            }

            // Create deal element
            const dealElement = this.createDealElement(deal);
            dealsContainer.appendChild(dealElement);
        });
    }

    createDealElement(deal) {
        const dealElement = document.createElement('div');
        dealElement.className = 'deal flex flex-column align-center';
    
        // Construct and append child elements
        dealElement.appendChild(this.createDealImageElement(deal.thumb));
        dealElement.appendChild(this.createDealTextElement(deal.title, deal.dealID));
        dealElement.appendChild(this.createDealPlatformElement(deal.storeID));
        const priceElement = this.createDealPriceElement(deal.savings, deal.normalPrice, deal.salePrice);
        dealElement.appendChild(priceElement);
        dealElement.appendChild(this.createToastyVaultRatingElement(deal.dealRating));
    
        return dealElement;
    }
    
    createDealImageElement(thumb) {
        const imgSource = thumb.replace('capsule_sm_120', 'header');
        const imgElement = document.createElement('img');
        imgElement.className = 'deal-img';
        imgElement.src = imgSource;
        return imgElement;
    }
    
    createDealTextElement(title, dealID) {
        const textElement = document.createElement('a');
        textElement.className = 'deal-title';
        textElement.innerText = title;
        textElement.href = `https://www.cheapshark.com/redirect?dealID=${dealID}`;
        textElement.target = '_blank';
        return textElement;
    }
    
    createDealPlatformElement(storeID) {
        const platformText = document.createElement('span');
        platformText.className = 'platform-text';
        const storeName = this.stores.find((s) => s.storeID === Number(storeID))?.storeName || 'Unknown';
        platformText.innerText = `Platform: ${storeName}`;
        return platformText;
    }
    
    createDealPriceElement(savings, normalPrice, salePrice) {
        const priceElement = document.createElement('div');
        priceElement.className = 'flex deal-price-element';
    
        const percentageOffElement = document.createElement('div');
        percentageOffElement.className = 'percent-off';
        percentageOffElement.innerText = `-${Math.floor(Number(savings))}%`;
    
        const normalPriceElement = document.createElement('span');
        normalPriceElement.className = 'normal-price';
        normalPriceElement.innerText = `$${normalPrice}`;
    
        const salePriceElement = document.createElement('span');
        salePriceElement.innerText = `$${salePrice}`;
    
        priceElement.append(percentageOffElement, normalPriceElement, salePriceElement);
        return priceElement;
    }
    
    createToastyVaultRatingElement(dealRating) {
        const ratingText = document.createElement('p');
        ratingText.className = 'toastyvault-rating';
        ratingText.innerText = dealRating === '0.0' ? 'ToastyVault Rating: N/A' : `ToastyVault Rating: ${Number(dealRating) * 10}/100`;
        return ratingText;
    }

    createPaginationControls() {
        const container = document.getElementById('page-select');
        container.innerHTML = '';

        const prevButton = document.createElement('button');
        prevButton.textContent = '< Prev';
        prevButton.disabled = this.currentPage === 1;
        prevButton.addEventListener('click', () => this.changePage(this.currentPage - 1));
        container.appendChild(prevButton);

        const pageIndicator = document.createElement('input');
        pageIndicator.id = 'page-input';
        pageIndicator.type = 'number';
        pageIndicator.value = `${this.currentPage}`;
        
        pageIndicator.addEventListener('change', () => {
            const newPage = parseInt(pageIndicator.value, 10);
            if (!isNaN(newPage) && newPage >= 1) {
                this.changePage(newPage);
            }
            else {
                // Reset to the current page if the input is invalid
                pageIndicator.value = this.currentPage.toString();
            }
        });

        container.appendChild(pageIndicator);

        const nextButton = document.createElement('button');
        nextButton.textContent = 'Next >';
        nextButton.disabled = !this.nextPageExists;
        nextButton.addEventListener('click', () => this.changePage(this.currentPage + 1));
        container.appendChild(nextButton);
    }

    changePage(newPage) {
        if (newPage < 1 || (!this.nextPageExists && newPage > this.currentPage)) {
            return;
        }
        this.currentPage = newPage;
        this.fetchDeals();
        this.createPaginationControls();
    }

    currentIndex() {
        return (this.currentPage - 1) * this.itemsPerPage;
    }
}

new DealFetcher();
