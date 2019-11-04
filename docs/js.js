(function () {
  var currenciesApiUrl = 'https://codelists.codeforiati.org/api/json/en/Currency.json'
  var morphApiUrl = 'https://cors-anywhere.herokuapp.com/https://api.morph.io/markbrough/exchangerates-scraper/data.json'
  var morphApiKey = 'wFTSIH61nwMjLBhphd4T'

  Vue.component('v-select', VueSelect.VueSelect)
  var project = new Vue({

    delimiters: ["<<", ">>"],
    el: '#project',

    data: {
      currencies: [{'code': 'XDR', 'label': 'XDR'}, {'code': 'GBP', 'label': 'GBP'}],
      supportedCurrencies: ["AUD", "BRL", "CAD", "CHF", "CLP", "CNY", "COP", "CRC",
        "CZK", "DKK", "EUR", "GBP", "HKD", "HUF", "IDR", "ILS", "INR", "ISK", "JPY",
        "KRW", "LKR", "LVL", "MXN", "MYR", "NOK", "NZD", "PLN", "RUB", "SEK", "SGD",
        "THB", "TRY", "TWD", "USD", "VEF", "XDR", "ZAR"],
      amountFrom: '1000000',
      currencyFrom: 'XDR',
      amountTo: '',
      currencyTo: 'GBP',
      date: '1998-11-12',
      fromRate: {},
      toRate: {},
      rate: ''
    },

    created: function () {
      this.getCurrencies()
      this.update()
    },

    watch: {
      currencyFrom: 'update',
      currencyTo: 'update',
      date: 'update',
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
      getCurrencyLabel(currency) {
        return `${currency.name} (${currency.code})`
      },
      getCurrencies() {
        axios.get(currenciesApiUrl)
          .then(data => {
            this.currencies = data.data.data.filter(currency=> {
              return this.supportedCurrencies.includes(currency.code)
            })
          })
      },
      getRate: function (currency, date) {
        if (currency === 'USD') {
          return new Promise((resolve, reject) => {
            resolve(
              { 'data':
                [{Rate: 1, Date: date}]
              },
              'success'
            )
          })
        }
        var query = 'SELECT * FROM `rates` WHERE `Currency` = "' + currency + '" ORDER BY ABS( strftime( "%s", `Date` ) - strftime( "%s", "' + date + '" ) ) ASC, Source DESC LIMIT 1'

        return axios.get(morphApiUrl, {
          headers: {
            'X-Requested-With': 'XMLHttpRequest',
          },
          params: {
            key: morphApiKey,
            query: query
          }
        })
      },
      update: async function () {
        var self = this
        self.rate = ''
        self.fromRate = {}
        self.toRate = {}
        self.amountTo = ''

        if (!self.currencyFrom || !self.currencyTo || !self.date) {
          return
        }

        var fromRate = await self.getRate(self.currencyFrom, self.date)
        var toRate = await self.getRate(self.currencyTo, self.date)

        self.fromRate = fromRate.data[0]
        fromRate = 1 / parseFloat(self.fromRate.Rate)
        self.toRate = toRate.data[0]
        toRate = parseFloat(self.toRate.Rate)
        self.rate = toRate * fromRate

        if (self.amountFrom) {
          self.recalc()
        }
      },
      recalc: function () {
        this.amountTo = this.amountFrom * this.rate
      }
    }
  })
}).call()
