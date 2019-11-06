(function () {
  var currenciesApiUrl = 'https://codelists.codeforiati.org/api/json/en/Currency.json'
  var morphApiUrl = 'https://api.morph.io/markbrough/exchangerates-scraper/data.json'
  var morphApiKey = 'wFTSIH61nwMjLBhphd4T'

  Vue.component('v-select', VueSelect.VueSelect)
  var project = new Vue({

    delimiters: ['<<', '>>'],
    el: '#project',

    data: {
      currencies: [{'code': 'EUR', 'label': 'EUR'}, {'code': 'GBP', 'label': 'GBP'}],
      supportedCurrencies: ['AUD', 'BRL', 'CAD', 'CHF', 'CLP', 'CNY', 'COP', 'CRC',
        'CZK', 'DKK', 'EUR', 'GBP', 'HKD', 'HUF', 'IDR', 'ILS', 'INR', 'ISK', 'JPY',
        'KRW', 'LKR', 'LVL', 'MXN', 'MYR', 'NOK', 'NZD', 'PLN', 'RUB', 'SEK', 'SGD',
        'THB', 'TRY', 'TWD', 'USD', 'VEF', 'XDR', 'ZAR'],
      amountFrom: '1000000',
      currencyFrom: 'EUR',
      amountTo: '',
      currencyTo: 'GBP',
      date: new Date().toISOString().substring(0, 10),
      fromRate: null,
      toRate: null,
      rate: ''
    },

    created: function () {
      this.getCurrencies()
      this.updateBoth()
    },

    watch: {
      currencyFrom: 'updateFrom',
      currencyTo: 'updateTo',
      date: 'updateBoth',
      amountFrom: 'recalc'
    },

    filters: {
      commify: (v) => {
        return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      },
      round: (v) => {
        return (Math.round(v * 100) / 100).toFixed(2)
      }
    },

    methods: {
      getCurrencyLabel (currency) {
        return `${currency.name} (${currency.code})`
      },
      getCurrencies () {
        axios.get(currenciesApiUrl)
          .then(data => {
            this.currencies = data.data.data.filter(currency => {
              return this.supportedCurrencies.includes(currency.code)
            })
          })
      },
      getRate: async function (currency, date) {
        if (currency === 'USD') {
          return new Promise((resolve, reject) => {
            resolve([{Rate: 1, Date: date}],
              'success'
            )
          })
        }
        var query = 'SELECT * FROM `rates` WHERE `Currency` = "' + currency + '" ORDER BY ABS( strftime( "%s", `Date` ) - strftime( "%s", "' + date + '" ) ) ASC, Source DESC LIMIT 1'

        return await fetchJsonp(`${morphApiUrl}?key=${morphApiKey}&query=${encodeURI(query)}`
        ).then(function (response) {
          return response.json()
        })
      },
      clear: function () {
        var self = this
        self.rate = ''
        self.amountTo = ''
      },
      refetch: async function () {
        var self = this
        if (self.currencyFrom === self.currencyTo) {
          return
        }
        if (self.currencyFrom && self.date && !self.fromRate) {
          self.fromRate = (await self.getRate(self.currencyFrom, self.date))[0]
        }
        if (self.currencyTo && self.date && !self.toRate) {
          self.toRate = (await self.getRate(self.currencyTo, self.date))[0]
        }
      },
      updateFrom: async function () {
        var self = this
        self.clear()
        self.fromRate = null
        await self.refetch()
        self.recalc()
      },
      updateTo: async function () {
        var self = this
        self.clear()
        self.toRate = null
        await self.refetch()
        self.recalc()
      },
      updateBoth: async function () {
        var self = this
        self.clear()
        self.fromRate = null
        self.toRate = null
        await self.refetch()
        self.recalc()
      },
      recalc: function () {
        var self = this
        if (self.currencyFrom === self.currencyTo && self.currencyFrom) {
          self.rate = 1
          self.amountTo = self.amountFrom
          return
        }
        if (self.fromRate && self.toRate) {
          var fromRate = 1 / parseFloat(self.fromRate.Rate)
          var toRate = parseFloat(self.toRate.Rate)
          self.rate = toRate * fromRate
          self.amountTo = self.amountFrom * self.rate
        }
      }
    }
  })
}).call()
