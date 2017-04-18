'use strict';
const PAGE_ACCESS_TOKEN = 'EAAT4LrttP0MBAOwRnSKhdseZAMOMzNokiUZC6Yp7rNttChI7bT1E6cbZAHXXuuAZBlXXbxbZBiE8RotPUCajSDU0jUIYKmfi0ZC98L20dCIT5Ja8ObdGNRNSFYmhCi2mIb04VU7lZCHstrq1WRXOAZAQb4X7B1adItPqP8zMAr9NgAZDZD';
const APIAI_TOKEN = '6b0c4a04dc0443c580cd545733c27f07';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const apiai = require('apiai');
const xml2js = require('xml2js'); 
const natural = require('natural'),tokenizer = new natural.WordPunctTokenizer();

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Express server listening on port %d in %s mode', server.address().port, app.settings.env);
});

const apiaiApp = apiai(APIAI_TOKEN);

/* For Facebook Validation */
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] && req.query['hub.verify_token'] === 'chatbot2017autopilot') {
    res.status(200).send(req.query['hub.challenge']);
  } else {
    res.status(403).end();
  }
});

/* Handling all messenges */
app.post('/webhook', (req, res) => {
  console.log(req.body);
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        if (event.message && event.message.text) {
          sendMessage(event);
        }
      });
    });
    res.status(200).end();
  }
});

/* GET query from API.ai */

function sendMessage(event) {
  var sender = event.sender.id;
  var text = event.message.text;

  var apiai = apiaiApp.textRequest(text, {
    sessionId: 'Niimble'
  });

  apiai.on('response', (response) => {
    console.log(response)
    var aiText = response.result.fulfillment.speech;

    request({
      url: 'https://graph.facebook.com/v2.6/me/messages',
      qs: {access_token: PAGE_ACCESS_TOKEN},
      method: 'POST',
      json: {
        recipient: {id: sender},
        message: {text: aiText}
      }
    }, (error, response) => {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
    });
  });

  apiai.on('error', (error) => {
    console.log(error);
  });

  apiai.end();
}

/* Webhook for API.ai to get response from the 3rd party API */
app.post('/ai', (req, res) => {
  var dwname = '';  
  var stock_name = '';  
  var msg = '';
  if (req.body.result.action == 'AskStock') {
    console.log('*** Stock Symbols ***');
    
    var stock_name = req.body.result.parameters['stockname'];
    var closing_price = req.body.result.parameters['ClosedPrice'];
    var last_price = req.body.result.parameters['LastPrice'];

    var callStockGOGL = [];
    var restUrl = 'http://www.google.com/finance/info?nfotype=infoquoteall&q=INDEXBKK:'+stock_name+'&callback=?';

    request({url: restUrl,json: true }, function (error, response, body) {
      if (!error && response.statusCode == 200 && body[0]) { 

        callStockGOGL.push(body.substring(3));

        var result = JSON.parse(callStockGOGL);

        if(last_price) {
          msg = 'ชื่อหุ้น ' + result[0].t + ' ราคา ณ ปัจจุบัน อยู่ที่ ' + result[0].l + ' บาท ข้อมูล ณ ' + result[0].lt;
        }else if(closing_price){ 
          msg = 'ชื่อหุ้น ' + result[0].t + ' ราคาปิดวันก่อนหน้า อยู่ที่ ' + result[0].pcls_fix + ' บาท ข้อมูล ณ ' + result[0].lt;
        }else {
          msg = 'ชื่อหุ้น ' + result[0].t;
        } 
        return res.json({speech: msg,displayText: msg,source: 'stock_name'});
        //return res.json({"text":"ท่านอยากทราบ","quick_reply": {"content_type":"text","title":["ราคาปัจจุบัน","ราคาเปิด","ราคาปิดล่าสุด"],"payload":"LLo"}});
        /*end if symbols + pricesymbols + price */
      } else {
        var errorMessage = 'I cannot find your stock symbol, please try again.';
        return res.status(400).json({ status: {code: 400,errorType: errorMessage}});
      }
    });
    /*end AskStock*/ 
  }

});
