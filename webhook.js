'use strict';
const PAGE_ACCESS_TOKEN = 'EAAT4LrttP0MBAOwRnSKhdseZAMOMzNokiUZC6Yp7rNttChI7bT1E6cbZAHXXuuAZBlXXbxbZBiE8RotPUCajSDU0jUIYKmfi0ZC98L20dCIT5Ja8ObdGNRNSFYmhCi2mIb04VU7lZCHstrq1WRXOAZAQb4X7B1adItPqP8zMAr9NgAZDZD';
const APIAI_TOKEN = '6b0c4a04dc0443c580cd545733c27f07';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const apiai = require('apiai');
const xml2js = require('xml2js'); 

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
  console.log('*** Webhook for api.ai query ***');
  console.log(req.body.result);
  var dwname = '';  
  var stock_name = '';  
  var msg = '';
  if (req.body.result.action == 'AskStock') {
    console.log('*** Stock Symbols ***');
    
    stock_name = req.body.result.parameters['stockname'];

    var callStockGOGL = [];
    //test var restUrl = 'https://google-stocks.herokuapp.com/?code=BKK:'+stock_name+'&format=json';
    //test var restUrl = 'https://stocksymbols.herokuapp.com/?symbol=BKK:'+stock_name+'&format=json';
    var restUrl = 'http://www.google.com/finance/info?nfotype=infoquoteall&q=INDEXBKK:'+stock_name+'&callback=?';

    request({url: restUrl,json: true }, function (error, response, result) {
      if (!error && response.statusCode == 200 && result[0].t !=="") { 
        callStockGOGL.push(body.substring(3));
        var result = JSON.parse(callStockGOGL);
        /*get fb User Information from Facebook, read: https://discuss.api.ai/t/how-to-get-user-information-from-facebook/465 */
        /*if apiai send user info = symbols + price*/
        msg = 'ชื่อหุ้น ' + result[0].t + ' ราคา ' + result[0].l + ' บาท เปลี่ยนแปลง ' + result[0].c + ' บาท ('+ result[0].cp+'%) ข้อมูล ณ ' + result[0].lt;
        return res.json({speech: msg,displayText: msg,source: 'stock_name'});
        /*end if symbols + pricesymbols + price */
      

      } else {
        var errorMessage = 'I cannot find your stock symbol, please try again.';
        return res.status(400).json({ status: {code: 400,errorType: errorMessage}});
      }
    });
    /*end AskStock*/ 
  }
  else if (!msg && req.body.result.action == 'AskDW') {
      console.log('*** DW Symbols ***');
      dwname = req.body.result.parameters['dwname'];   
      var dwUserKey =''; /*เอาค่าที่คนพิมพ์มาด้วย DW PTTO1 or DW PTT01C1705A or DW PTT Call*/
      var cun = 0; 
      var msg = ''; 
      var myJSONObject = []; 
      var msgDW = '';
      var dwUrl = 'http://49.231.7.202:8080/axis2/services/DWService/getDWCalculatorByFormat?secSym='+dwname+'&format=json';
        
      request({url: dwUrl,json: true }, function (error, response, body) {
          if (!error && response.statusCode == 200 && body[0]) {
              xml2js.parseString(body, function (err, result) {
              myJSONObject.push(result);
              var json = JSON.parse(myJSONObject[0]['ns:getDWCalculatorByFormatResponse']['ns:return']);
                
              var nn = json.totalRecord;
                       
                
                
                for (cun = 0;cun<nn;cun++){
                  //if(json['resultSet'][cun].IssuerSym == 'BLS'){
                  
                    msgDW += 'Underlying ' + json['resultSet'][cun].UnderlyingSym + ' DW: '+ json['resultSet'][cun].SecSym + ' ราคา ' + json['resultSet'][cun].LstPrice + ' ';
                   
                  /*แก้ msgDW 
                  คุณสามารถเลือก DW อ้างอิงหุ้น PTT (underlyingAssetSym) ทั้งหมดได้ที่นี่ โดย DW ชนิด Call: ซื้อเมื่อคาดว่าราคาหุ้น Underlying จะขึ้น และ DW ชนิด Put: ซื้อเมื่อคาดว่าราคาหุ้น Underlying จะลง
                  (* ข้อมูล ณ 30/03/2560 17.00 น. updDate + updTime)
                  PTT01C1705A(secSym)| ชนิด Call dwType | ราคาปัจจุบัน 1.38 LstPrice บาท | ราคาเสนอซื้อเบื้องต้น 1.30 estIndicativePrice บาท | วันซื้อขายวันสุดท้าย
                  lastTradeDate |  สถานะ DW moneyness 
                  PTT01C1708A(secSym) | ชนิด Call dwType | ราคาปัจจุบัน 1.38 LstPrice บาท | ราคาเสนอซื้อเบื้องต้น 1.30 estIndicativePrice บาท | วันซื้อขายวันสุดท้าย
                  lastTradeDate |  สถานะ DW moneyness                 
                  Put DW: ซื้อเมื่อคาดว่าราคาหุ้น PTT จะลง
                  PTT01P1705A(secSym)| ชนิด Put dwType | ราคาปัจจุบัน 1.38 LstPrice บาท | ราคาเสนอซื้อเบื้องต้น 1.30 estIndicativePrice บาท | วันซื้อขายวันสุดท้าย
                  lastTradeDate |  สถานะ DW moneyness 
                  PTT01P1708A(secSym) | ชนิด Put dwType |ราคาปัจจุบัน 1.38 LstPrice บาท | ราคาเสนอซื้อเบื้องต้น 1.30 estIndicativePrice บาท | วันซื้อขายวันสุดท้าย
                  lastTradeDate |  สถานะ DW moneyness 


                  Button 1 : PTT01C1705A (playload ="underlyingSym dwType DW" Ex: PTT Call DW)
                  Button 2 : PTT01C1708A (playload ="underlyingSym dwType DW")
                  Button 3 : PTT01P1705A (playload ="underlyingSym dwType DW")
                  Button 3 : PTT01P1708A (playload ="underlyingSym dwType DW")

                    
                    
                    */                 
                  //}
                   /* แก้เป็น Fb Button Template....
                   "type":"template",
                    "payload":{
                    "template_type":"button",
                    "text":"msgDW",
                    for (cun = 0;cun<nn;cun++){
                     "buttons":[
                      
                        {
                          "type":"postback",
                          "title":" json['resultSet'][cun].SecSym", เอา symbol DW มาใส่
                          "payload":" underlyingSym Call DW" เพื่อ map entities ให้ใหม่
                        },
                       }
                        */
                  
                  
                } /*end for loop*/
                
                return res.json({speech: msgDW,displayText: msgDW,source: 'stock_name'}); /* แก้เป็น display เป็น Fb format*/
            });
          }

        })
    /*end AskDW*/
  }
  else {
    var msg = 'I cannot find your DW, please try again.';
    return res.json({speech: msg,displayText: msg});
  }

});
