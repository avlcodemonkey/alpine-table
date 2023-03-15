const TableSetting = Object.freeze({
    CurrentPage: 'currentPage',
    PerPage: 'perPage',
    SearchQuery: 'searchQuery',
    Sort: 'sort',
});

const SortOrder = Object.freeze({
    Asc: 'asc',
    Desc: 'desc',
});

export default (key, src) => ({
    // from html placeholder for the table
    key: key,
    src: src,

    // internal state
    rows: undefined,
    filteredRows: [],
    filteredRowTotal: 0,
    sortColumns: [],
    currentPage: 0,
    perPage: 10,
    maxPage: 0,
    searchQuery: '',

    fetchSetting(name) {
        return sessionStorage.getItem(`${this.key}_${name}`);
    },

    saveSetting(name, value) {
        sessionStorage.setItem(`${this.key}_${name}`, value.toString());
    },

    defaultCompare(a, b) {
        return a._index > b._index ? 1 : a._index < b._index ? -1 : 0;
    },

    compare(a, b) {
        let i = 0;
        const len = this.length;
        for (; i < len; i++) {
            const sort = this[i];
            const aa = a[sort.property];
            const bb = b[sort.property];

            if (aa === null)
                return 1;
            if (bb === null)
                return -1;
            if (aa < bb)
                return sort.sortOrder === SortOrder.Asc ? -1 : 1;
            if (aa > bb)
                return sort.sortOrder === SortOrder.Asc ? 1 : -1;
        }
        return 0;
    },

    /**
     * Filter an array of objects to find objects where value contains the value of `this`.
     * @this {String} Value to search for
     * @param {Object} obj - Object to search in.
     * @returns {bool} True if object contains `this`.
     */
    filterArray(obj) {
        const tokens = (this || '').split(' ');
        for (const key in obj) {
            if (key.indexOf('_') < 0 && Object.prototype.hasOwnProperty.call(obj, key)) {
                const objVal = (obj[key] + '').toLowerCase();
                if (tokens.every((x) => objVal.indexOf(x) > -1)) {
                    return true;
                }
            }
        }
        return false;
    },

    filterData() {
        // create a new array and filter by the search query
        const filteredData = this.searchQuery ? this.rows?.filter(this.filterArray.bind(this.searchQuery.toLowerCase())) : [...(this.rows ?? [])];

        // sort the new array
        filteredData.sort(this.sortColumns?.length ? this.compare.bind(this.sortColumns) : this.defaultCompare)

        // cache the total number of filtered records and max number of pages for paging
        this.filteredRowTotal = filteredData.length;
        this.maxPage = Math.max(Math.ceil(this.filteredRowTotal / this.perPage) - 1, 0);

        // determine the correct slice of data for the current page, and reassign our array to trigger the update
        this.filteredRows = filteredData.slice(this.perPage * this.currentPage, (this.perPage * this.currentPage) + this.perPage);
    },

    onSearchQueryInput(event) {
        const val = event?.target?.value;
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(() => {
            if (this.searchQuery !== val) {
                this.currentPage = 0;
                this.saveSetting(TableSetting.SearchQuery, val);
            }
            this.searchQuery = val;
            this.filterData();
        }, 250);
    },

    onPerPageInput(event) {
        const newVal = parseInt(event?.target?.value ?? 10, 10) ?? 10;
        if (this.perPage !== newVal) {
            this.currentPage = 0;
            this.saveSetting(TableSetting.PerPage, newVal);
        }
        this.perPage = newVal;

        this.filterData();
    },

    onFirstPageClick() {
        this.setPage(0);
    },

    onLastPageClick() {
        this.setPage(this.maxPage);
    },

    onPreviousPageClick() {
        this.setPage(Math.max(this.currentPage - 1, 0));
    },

    onNextPageClick() {
        this.setPage(Math.min(this.currentPage + 1, this.maxPage));
    },

    setPage(page) {
        this.currentPage = page;
        this.saveSetting(TableSetting.CurrentPage, this.currentPage);
        this.filterData();
    },

    onSortClick(property) {
        if (!property) {
            return;
        }

        const index = this.sortColumns.findIndex((x) => x.property === property);
        if (index === -1) {
            this.sortColumns.push({ property: property, sortOrder: SortOrder.Asc });
        } else if (this.sortColumns[index].sortOrder === SortOrder.Asc) {
            this.sortColumns[index].sortOrder = SortOrder.Desc;
        } else {
            this.sortColumns = this.sortColumns.filter((x) => x.property != property);
        }

        this.saveSetting(TableSetting.Sort, JSON.stringify(this.sortColumns));

        this.filterData();
    },

    sortClass(property) {
        const index = property ? this.sortColumns.findIndex((x) => x.property === property) : -1;
        if (index === -1) {
            return;
        }
        return this.sortColumns[index].sortOrder === SortOrder.Asc ? 'alpine-sort-asc' : 'alpine-sort-desc';
    },

    get startRowNumber() {
        return this.filteredRowTotal ? (this.currentPage * this.perPage) + 1 : 0;
    },

    get endRowNumber() {
        return this.filteredRowTotal ? Math.min((this.currentPage + 1) * this.perPage, this.filteredRowTotal) : 0;
    },

    get isFirstPage() {
        return this.currentPage === 0;
    },

    get isLastPage() {
        return this.currentPage === this.maxPage;
    },

    get is10PerPage() {
        return this.perPage === 10;
    },

    get is20PerPage() {
        return this.perPage === 20;
    },

    get is50PerPage() {
        return this.perPage === 50;
    },

    get is100PerPage() {
        return this.perPage === 100;
    },

    async fetchData() {
        if (!this.src.length) {
            return;
        }

        try {
            this.rows = (await fetch(this.src, { headers: {'X-Requested-With': 'XMLHttpRequest'} })
                .then((res) => res.json()))
                .map((x, index) => {
                    x._index = index;
                    return x;
                }) ?? [];
        } catch {
            this.rows = [];
        }
        this.filterData();
    },

    async init() {
        // check sessionStorage for saved settings
        this.perPage = parseInt(this.fetchSetting(TableSetting.PerPage) ?? '10', 10);
        this.currentPage = parseInt(this.fetchSetting(TableSetting.CurrentPage) ?? '0', 10);
        this.searchQuery = this.fetchSetting(TableSetting.SearchQuery) ?? '';
        this.sortColumns = JSON.parse(this.fetchSetting(TableSetting.Sort) ?? '[]');

        await this.fetchData();
    },
});
