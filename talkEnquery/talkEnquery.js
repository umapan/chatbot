exports.findById = function (msg) {
	
const natural = require('natural'),tokenizer = new natural.WordPunctTokenizer();
const request = require('sync-request');

const
  user = require('./user.json'),keyword = require('./keyword.json'),
  equity = require('./equity.json'),common = require('./common.json'),
  transaction = require('./transaction.json'),openingaccount = require('./openingaccount.json'),
  error = require('./error.json'),symbol = require('./symbol.json');

  var arrNoun = []; var result = []; var securities = []; var output = []; var infostock = []; var answer=[]; var dwlist = [];
  var num = 0; var ids = 0; var coun = 0; var keyword_wording = '';
  var wrd = ""; var keyword_wording = "";

  Number.prototype.format = function(n, x, s, c) {
      var re = '\\d(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\D' : '$') + ')',
          num = this.toFixed(Math.max(0, ~~n));

      return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), '$&' + (s || ','));
  };

  //Get keyword
  for(j in keyword.entries){
    for(sy in keyword.entries[j].synonyms){  
      var echa = msg.match(new RegExp("(?:"+keyword.entries[j].synonyms[sy]+")+", "gi"));
      console.log(msg+" | "+keyword.entries[j].synonyms[sy]);
      if(echa){ keyword_wording = keyword.entries[j].value; }
    }
  }


  //if there is no keyword, it turns to enquery for searching stock symbol or DW symbols.
  if(!keyword_wording){ keyword_wording = "enquery"; }

  //Grap what a user would like to do
  for(b in user.entries){
    for(syno in user.entries[b].synonyms){  
      var echa = msg.match(new RegExp("(?:"+user.entries[b].synonyms[syno]+")+", "gi"));
      if(echa){ arrNoun[ids] = user.entries[b].value; ids++; }
    }
  }

  switch(keyword_wording){
    case "equity" : var answer = tokenWording_arrNoun(equity); break;
    case "openingaccount" : var answer = tokenWording_arrNoun(openingaccount); break;
    case "derivatives" : var answer = tokenWording_arrNoun(derivatives); break;
    case "transaction" : var answer = tokenWording_arrNoun(transaction); break;
    case "common" : var answer = tokenWording_arrNoun(common); break;
    case "enquery" : var answer = findingtype_ofsecurities(msg,arrNoun); break;
  }

  return answer;

  //Get a best answer by classify with keyword and a noun group of action
  function tokenWording_arrNoun(arrGroup){
    var ans_sentence = []; 
     for(n in arrGroup){
      var numb = 0;
        for(m in arrGroup[n].tokenwording){
          for(o in arrNoun){
            var echa = arrNoun[o].match(new RegExp("(?:"+arrGroup[n].tokenwording[m]+")+", "gi"));
            if(echa) numb++;
          }
        }
      //// Find the best answer from keyword ////
      ans_sentence.push(numb); 
      }    
      if(ans_sentence){
        var index_bestanswer = ans_sentence.indexOf(Math.max.apply(null, ans_sentence));
        result[0] = arrGroup[index_bestanswer].answer[Math.floor(Math.random() * arrGroup[n].answer.length)];
      }

     if(!result[0]) result[0] = error[0].answer[Math.floor(Math.random() * error[0].answer.length)];
     return result;
  }
  //Get a best answer by classify with keyword and a noun group of action
  function findingtype_ofsecurities(msg,arrNoun){
    var dw_Answer = [];
    var EN_monthNames = ["","Jan", "Feb", "Mar", "Apr", "May", "Jun","Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    var TH_monthNames = ["","มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"];
    var dw =[]; var re_stock = []; var dwlist = []; var dw_titleURL = []; var dw_url_arry =[]; var titleDWButton = ""; var DWsentence;
    var dwPut_list = [];  var dwPut_subtitle_arry = []; var dwPut_url_arry = []; var dwPut_imageurl_arry = [];  var dwPut_titleURL = []; var dwCall_postbacktitleURL = []; var titleDWCallButton = "";
    var dwCall_list = []; var dwCall_subtitle_arry = []; var dwCall_url_arry = [];  var dwCall_imageurl_arry = []; var dwCall_titleURL = []; var dwPut_postbacktitleURL = []; var titleDWPutButton = "";
    var leng = 0; var res = '';  var coun = 0; var incal_dw = 0; var input_dw = 0; 
    
    var token = tokenizer.tokenize(msg);
    for(s in symbol){
      for(k in token){
        var stock = token[k].match(new RegExp("(?:"+symbol[s].sec_sym+")+", "gi"));
        var distance = natural.JaroWinklerDistance(symbol[s].sec_sym,token[k]);
        if(stock && symbol[s].sec_sym.length > leng && distance == 1){
          var stock_name = symbol[s].sec_sym;
        }
      }
    }

    var indexThai = [{"sec_sym":"S50"},{"sec_sym":"SET50"},{"sec_sym":"SET"},{"sec_sym":"SETHD"},{"sec_sym":"SET100"},{"sec_sym":"MAI"}];
    if(stock_name){
      if(stock_name.length < 5){ var _stockinfo = stock_info(stock_name); }
      DWsentence = stock_name;
    }else{
      for(y in indexThai){
        for(u in token){
          var stock = token[u].match(new RegExp("(?:"+indexThai[y].sec_sym+")", "gi"));
          var distance = natural.JaroWinklerDistance(indexThai[y].sec_sym,token[u]);
          if(stock && indexThai[y].sec_sym.length > leng && distance == 1){
            if(indexThai[y].sec_sym == 'S50') var stock_name = 'SET50';
            else var stock_name = indexThai[y].sec_sym;
          }
        }
      }
      
      if(stock_name) var _stockinfo = stock_info(stock_name);
      else if(arrNoun[0] === 'Stockinfo'){
        //If user types "stock" or "หุ้น", it will return SET information.
        stock_name = 'SET';
        var _stockinfo = stock_info(stock_name);
      }

      if(stock_name === "SET50") DWsentence = 'S50';

    }
    
    /////// Get Stock Info  ///////
    if(_stockinfo){
      var stock_name = _stockinfo[0];  var s_price = _stockinfo[1]; 
      var day = parseInt(_stockinfo[2]); var month = parseInt(_stockinfo[3]); var year = parseInt(_stockinfo[4]); var hour = _stockinfo[5]; 
      var ClosedPrice = _stockinfo[6]; var imgChart = _stockinfo[7];
      var Chgprice = _stockinfo[8]; var PerChg = _stockinfo[9]; var HiPrice = _stockinfo[10];
      var LowPrice = _stockinfo[11]; var PE = _stockinfo[12]; var EPS = _stockinfo[13]; var Vol = _stockinfo[14];
      var Openprice = _stockinfo[15]; var ComName = _stockinfo[16];
        
      var _Present_StockInfo = "ราคาปัจจุบันของ "+stock_name+" อยู่ที่ "+s_price;
      var _Past_StockInfo = "ราคาปิดก่อนหน้าของ "+stock_name+" อยู่ที่ "+ClosedPrice;
      var _datetotime = "ข้อมูล ณ วันที่ "+day+" "+TH_monthNames[month]+" "+year+" เวลา "+hour+" น.";
      var _StockMoreInfo = "Open price : "+Openprice+" High price/Low price : "+HiPrice+"/"+LowPrice+"\nVolume : "+Vol+"\nPE : "+PE+" EPS : "+EPS;
      var Company_name = ComName+" ("+stock_name+")";
    }

    /////// Get DW Info  ///////
    var _DWinfo = DW_info(DWsentence);

    for(in_dw in _DWinfo) {
      if(_DWinfo[in_dw][0]){ 
        if(_DWinfo[in_dw][0].dwType == 'C') var DwType = "Call"; else var DwType = "Put"; 
        //////////////  DW Information  //////////////
          var UnderlyingSym = String(_DWinfo[in_dw][0].underlyingSym);
          var highPrice = Number(_DWinfo[in_dw][0].highPrice).format(2, 3, ',', '.');  
          var lowPrice = Number(_DWinfo[in_dw][0].lowPrice).format(2, 3, ',', '.');  
          var bidPrice = Number(_DWinfo[in_dw][0].bidPrice1).format(2, 3, ',', '.');  
          var ofrPrice = Number(_DWinfo[in_dw][0].ofrPrice1).format(2, 3, ',', '.');  
          var DW_LstPrice = Number(_DWinfo[in_dw][0].lstPrice).format(2, 3, ',', '.');
          var TimeDecay = Number(_DWinfo[in_dw][0].timeDecay).format(2, 3, ',', '.');
          var EffGearing = Number(_DWinfo[in_dw][0].effGearing).format(2, 3, ',', '.');
            
          var DW_name = String(_DWinfo[in_dw][0].secSym);
          var DwType = String(_DWinfo[in_dw][0].dwType);
          var Sensitivity = Number(_DWinfo[in_dw][0].sensitivity).format(2, 3, ',', '.');
          var TimeVal = Number(_DWinfo[in_dw][0].timeVal).format(2, 3, ',', '.');
          var InstrinsicVal = Number(_DWinfo[in_dw][0].instrinsicVal).format(2, 3, ',', '.');
          var exPrice = Number(_DWinfo[in_dw][0].exPrice).format(2, 3, ',', '.');
          var erPerUnderlying = Number(_DWinfo[in_dw][0].erPerUnderlying).format(2, 3, ',', '.');
          var moneyness = Number(_DWinfo[in_dw][0].moneyness).format(2, 3, ',', '.');
          var impliedVol = Number(_DWinfo[in_dw][0].impliedVol).format(2, 3, ',', '.');
          var pctPrem = Number(_DWinfo[in_dw][0].pctPrem).format(2, 3, ',', '.');
          var timeVal = Number(_DWinfo[in_dw][0].timeVal).format(2, 3, ',', '.');
          var instrinsicVal = Number(_DWinfo[in_dw][0].instrinsicVal).format(2, 3, ',', '.');
          var outstanding = String(_DWinfo[in_dw][0].outstanding);
          var suitAbility = String(_DWinfo[in_dw][0].suitAbility);
          var EstIndicativePrice = Number(_DWinfo[in_dw][0].estIndicativePrice).format(2, 3, ',', '.');

        //////////////  DATE  //////////////
          var _date = String(_DWinfo[in_dw][0].updDate);
          var _time = String(_DWinfo[in_dw][0].updTime);
          var MaturityDate = String(_DWinfo[in_dw][0].maturityDate);
          var RemainMaturity = String(_DWinfo[in_dw][0].remainMaturity);
          var FirstTradeDate = String(_DWinfo[in_dw][0].firstTradeDate);
          var LastTradeDate = String(_DWinfo[in_dw][0].lastTradeDate);
            
          var day = parseInt(_date.substr(6, 2));   var month = _date.substr(4, 2);  var year = _date.substr(0, 4);
          var currentHour = new Date().getHours(); 
          var hour = parseInt(_time.substr(0, 2));
          if(currentHour > 12) var hour = hour + 12;
          var minu = _time.substr(2, 2); 
          var img_datetotime = year+"-"+EN_monthNames[parseInt(month.pas)]+"-"+day;
          var datetotime = "ณ วันที่ "+day+" "+TH_monthNames[parseInt(month)]+" "+(parseInt(year)+543)+" เวลา "+hour+":"+minu+" น.";

          var _MaturityDay = parseInt(MaturityDate.substr(6, 2));   var _Maturitymonth = parseInt(MaturityDate.substr(4, 2));  var _Maturityyear = MaturityDate.substr(0, 4);
          var _MaturityDate = _MaturityDay+"-"+EN_monthNames[_Maturitymonth]+"-"+_Maturityyear;  var _THMaturityDate = _MaturityDay+" "+TH_monthNames[_Maturitymonth]+" "+(parseInt(_Maturityyear)+543); 
          var img_MaturityDate = _Maturityyear+"-"+_Maturitymonth+"-"+_MaturityDay;

          var _FirstDay = parseInt(FirstTradeDate.substr(6, 2));   var _Firstmonth = parseInt(FirstTradeDate.substr(4, 2));  var _Firstyear = FirstTradeDate.substr(0, 4);
          var _FirstDate = _FirstDay+"-"+EN_monthNames[_Firstmonth]+"-"+_Firstyear;   var _THFirstDate = _FirstDay+" "+TH_monthNames[_Firstmonth]+" "+(parseInt(_Firstyear)+543);
          var img_FirstDate = _Firstyear+"-"+_Firstmonth+"-"+_FirstDay;

          var _Lastday = parseInt(LastTradeDate.substr(6, 2));   var _Lastmonth = parseInt(LastTradeDate.substr(4, 2));  var _Lastyear = LastTradeDate.substr(0, 4);
          var _Lastdate = _Lastday+"-"+EN_monthNames[_Lastmonth]+"-"+_Lastyear;   var _THLastdate = _Lastday+" "+TH_monthNames[_Lastmonth]+" "+(parseInt(_Lastyear)+543);
          var img_Lastdate = _Lastyear+"-"+_Lastmonth+"-"+_Lastday;

        //////////////  Status  //////////////
          var status = String(_DWinfo[in_dw][0].status);
          if(status === '3') var Indstatus = 'ราคาซื้อขายปัจจุบันอยู่สูงกว่าระดับที่เหมาะสม โปรดหลีกเลี่ยงการซื้อขาย';
          else if(status === '-2') var Indstatus = 'ราคาเสนอซื้อเบื้องต้น '+EstIndicativePrice+' บาท';
          else var Indstatus = ' ';
        
        //////////////  GET DW01 DATA INTO STORAGE  //////////////
          dwlist.push(_DWinfo[in_dw][0].secSym);
          titleDWButton = titleDWButton + UnderlyingSym +" "+ datetotime + " ดังนี้ \n\n " + DW_name + "\nIndicative price " + EstIndicativePrice + " คำเตือน " + suitAbility + "\n";
          _DW_URLTable = "http://www.blswarrant.com/fb/DW01PriceCalculatorfb_mobile_3.php?secSym=" + DW_name;
          _DW_URLImage = "http://www.blswarrant.com/fb/get_blswarrant_image_2.php?secSym=" + DW_name;
          dw_url_arry.push(_DW_URLTable);

          var _DWCALL_details = DW_name+" เป็น DW01 อ้างอิง "+UnderlyingSym+" ชนิด "+DwType+" ซื้อเมื่อคาดว่าราคา "+UnderlyingSym+" จะขึ้น";
          var _DWPUT_details = DW_name+" เป็น DW01 อ้างอิง "+UnderlyingSym+" ชนิด "+DwType+" ซื้อเมื่อคาดว่าราคา "+UnderlyingSym+" จะลง";
          var _DW_details = "\n\nสามารถซื้อขายวันสุดท้ายได้ วันที่ "+_THLastdate+"\n\nข้อมูล "+datetotime+"\n\n"+Indstatus+"\n\nIndicative price "+EstIndicativePrice+" Baht\nStrike price "+exPrice+" Baht\nExercise ratio "+erPerUnderlying+" (DW:UL)\nLast trading day "+_Lastdate+"\nEffective gearing "+EffGearing+"x\nSensitivity "+Sensitivity+"x\nTime decay "+TimeDecay+" %\nAll in premium "+pctPrem+" %\nInstrinsic value "+instrinsicVal+" Baht\nTime value "+timeVal+" Baht";
          var _DW_TitleURLButton = "ดูตาราง " + DW_name;
          var _DW_PostbackURLButton = "ข้อมูล " + DW_name;
          
          dw_Answer.push({"answer": [{"functions":"sendButton_Message","buttonType":"web_url","title":_DW_TitleURLButton,"info":_DW_URLTable,"randomtext":DW_name + "\n ราคารับซื้อคืน " + EstIndicativePrice + " คำเตือน " + suitAbility + "\n"}]});
          dw_titleURL.push(_DW_TitleURLButton);

        //////////////  GET CALL DW01 DATA INTO STORAGE  //////////////
        if(DwType === 'C'){ 
          dwCall_list.push(DW_name); 
          //dwCall_imageurl_arry.push("http://www.blswarrant.com/dwtools/graph/dw1_graph.php?symbol="+DW_name+"&FirstTradingDate="+img_FirstDate+"&LastTradingDate="+img_Lastdate+"&MaturityDate="+img_MaturityDate+"&DayLeft="+RemainMaturity);
          dwCall_imageurl_arry.push(_DW_URLImage);
          dwCall_subtitle_arry.push(String(_DWCALL_details + _DW_details));          
          dwCall_postbacktitleURL.push(_DW_PostbackURLButton);

          dwCall_titleURL.push(_DW_PostbackURLButton);
          dwCall_url_arry.push(_DW_TitleURLButton);
          
          titleDWCallButton = titleDWCallButton + DW_name + "\n ราคารับซื้อคืน " + EstIndicativePrice + " คำเตือน " + suitAbility + "\n";
        }

        //////////////  GET PUT DW01 DATA INTO STORAGE  //////////////
        if(DwType === 'P'){ 
          dwPut_list.push(DW_name);
          //dwPut_imageurl_arry.push("http://www.blswarrant.com/dwtools/graph/dw1_graph.php?symbol="+DW_name+"&FirstTradingDate="+img_FirstDate+"&LastTradingDate="+img_Lastdate+"&MaturityDate="+img_MaturityDate+"&DayLeft="+RemainMaturity);
          dwPut_imageurl_arry.push(_DW_URLImage);
          dwPut_subtitle_arry.push(String(_DWPUT_details + _DW_details));          
          dwPut_postbacktitleURL.push(_DW_PostbackURLButton);
          dwPut_titleURL.push(_DW_PostbackURLButton);
          dwPut_url_arry.push(_DW_TitleURLButton);
          
          titleDWPutButton = titleDWPutButton + DW_name + "\n ราคารับซื้อคืน " + EstIndicativePrice + " คำเตือน " + suitAbility + "\n";
        }
      } 
    }
    var titleButton = "กรุณาเลือกดู DW01 อ้างอิง" + UnderlyingSym +" "+ datetotime + " ดังนี้ \n\n " + titleDWButton;
    var titleCallButton = "กรุณาเลือกดู DW01 อ้างอิง" + UnderlyingSym +" "+ datetotime + " ดังนี้ \n\n " + "Call DW: ซื้อเมื่อคาดว่าราคา " + UnderlyingSym +" จะขึ้น \n" + titleDWCallButton;
    var titlePutButton = "กรุณาเลือกดู DW01 อ้างอิง" + UnderlyingSym +" "+ datetotime + " ดังนี้ \n\n " + "Put DW: ซื้อเมื่อคาดว่าราคา " + UnderlyingSym +" จะลง \n" + titleDWPutButton;
/*
console.log("_stockinfo"); console.log(_stockinfo);
console.log("arrNoun"); console.log(arrNoun);
console.log("dwlist"); console.log(dwlist);
*/
    if(_stockinfo && _stockinfo.length != 0 && stock_name !== "SET"){ 
      if(arrNoun.length != 0){
        for(im in arrNoun){
          switch(arrNoun[im]){
            case "Stockinfo" : 
              var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ราคาปัจจุบัน "+stock_name,"ราคาปิดล่าสุด "+stock_name,"ราคา"+stock_name+" DW01"],"randomtext":"คุณต้องการทราบเรื่องใดค่ะ","payload":"STOCKINFO_ENQUIRY_SELECTING"}]}];  
              break;
            case "PriceNow" : 
              var infostock = [{"answer": [
                {"functions":"sendQuickReply","titleArray":["เปิดบัญชี","สัมมนาบัวหลวง","ข้อมูลหลักทรัพย์","ฝากเงิน"],"randomtext":"อยากรู้เรื่องไหนต่อดีค่ะ","payload":"No_Answer_TakingEnqury_QuickReply"},
                {"functions":"sendTextMessage","randomtext":_Present_StockInfo+"\n\n"+_datetotime},
                {"functions":"sendImageMessage","image_url":imgChart},{"functions":"sendTextMessage","randomtext":"ข้อมูลกราฟจาก Aspen"}
              ]}];  
              break;
            case "OpenPrice" : 
              var infostock = [{"answer": [
                {"functions":"sendQuickReply","titleArray":["เปิดบัญชี","สัมมนาบัวหลวง","ข้อมูลหลักทรัพย์","ฝากเงิน"],"randomtext":"อยากรู้เรื่องไหนต่อดีค่ะ","payload":"No_Answer_TakingEnqury_QuickReply"},
                {"functions":"sendTextMessage","randomtext":_Present_StockInfo+"\n\n"+_datetotime},
                {"functions":"sendImageMessage","image_url":imgChart},{"functions":"sendTextMessage","randomtext":"ข้อมูลกราฟจาก Aspen"}
              ]}];
              break;
            case "OtherStockInfo" : 
              var infostock = [{"answer": [
                {"functions":"sendQuickReply","titleArray":["เปิดบัญชี","สัมมนาบัวหลวง","ข้อมูลหลักทรัพย์","ฝากเงิน"],"randomtext":"อยากรู้เรื่องไหนต่อดีค่ะ","payload":"No_Answer_TakingEnqury_QuickReply"},
                {"functions":"sendTextMessage","randomtext":_Present_StockInfo+"\n\n"+_datetotime+"\n\n"+Company_name+"\n\n"+_StockMoreInfo},
                {"functions":"sendImageMessage","image_url":imgChart},{"functions":"sendTextMessage","randomtext":"ข้อมูลกราฟจาก Aspen"}
              ]}];
              break;
            case "ClosePrice" : 
              var infostock = [{"answer": [
                {"functions":"sendQuickReply","titleArray":["เปิดบัญชี","สัมมนาบัวหลวง","ข้อมูลหลักทรัพย์","ฝากเงิน"],"randomtext":"อยากรู้เรื่องไหนต่อดีค่ะ","payload":"No_Answer_TakingEnqury_QuickReply"},
                {"functions":"sendTextMessage","randomtext":_Past_StockInfo+"\n\n"+_datetotime},
                {"functions":"sendImageMessage","image_url":imgChart},{"functions":"sendTextMessage","randomtext":"ข้อมูลกราฟจาก Aspen"}
              ]}];
              break;
            case "S50DWInfo" : 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":[stock_name + " PUT",stock_name+" CALL"],"randomtext":"คุณต้องการถาม DW ตัวใดค่ะ","payload":"S50DWInfo_ENQUIRY_SELECTING"}]}]; 
              break;
            case "S50DWCall" : 
              if(dwCall_list) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwCall_list,"randomtext":" คุณต้องการถาม DW ใดค่ะ","payload":"S50DWCall_ENQUIRY_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"S50DWCall_NO_ANSWER"}]}];
              break;
            case "S50DWPut" : 
              if(dwPut_list) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwPut_list,"randomtext":" คุณต้องการถาม DW ใดค่ะ","payload":"S50DWPut_ENQUIRY_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"S50DWPut_NO_ANSWER"}]}];
              break;
            case "DWInfo" : 
              if(dwlist) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwlist,"randomtext":" คุณต้องการถาม DW ใดค่ะ","payload":"DWInfo_ENQUIRYLIST_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"DWInfo_NOANSWER"}]}];
              break;
            case "DWPut" : 
              if(dwPut_list) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwPut_list,"randomtext":" คุณต้องการถาม DW01 PUT ใดค่ะ","payload":"DWPut_ENQUIRYLIST_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"DWPut_NOANSWER"}]}];
              break;
            case "DWCall" : 
              if(dwCall_list) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwCall_list,"randomtext":" คุณต้องการถาม DW01 CALL ใดค่ะ","payload":"DWCall_ENQUIRYLIST_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"DWCall_NOANSWER"}]}];
              break;
          }
        }
      }else{
        var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["หุ้น "+stock_name,"DW01 "+stock_name],"randomtext":"คุณต้องการทราบเรื่องใดค่ะ","payload":"STOCKINFO_ENQUIRY_SELECTING"}]}];
      }
    }else if(dwlist && dwlist.length != 0){
      if(dwlist.length > 1){
        for(bv in arrNoun){
          switch(arrNoun[bv]){
            case "S50DWInfo" : 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":[stock_name + " PUT",stock_name+" CALL"],"randomtext":"คุณต้องการถาม DW ตัวใดค่ะ","payload":"S50DWInfo_ENQUIRYLIST_SELECTING"}]}]; 
              break;
            case "S50DWCall" : 
              if(dwCall_list) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwCall_list,"randomtext":" คุณต้องการถาม DW ใดค่ะ","payload":"S50DWCall_ENQUIRYLIST_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"S50DWCall_NOANSWER"}]}];
              break;
            case "S50DWPut" : 
              if(dwPut_list) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwPut_list,"randomtext":" คุณต้องการถาม DW ใดค่ะ","payload":"S50DWPut_ENQUIRYLIST_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"S50DWPut_NOANSWER"}]}];
              break;
            case "DWInfo" : 
              if(dwlist) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwlist,"randomtext":" คุณต้องการถาม DW ใดค่ะ","payload":"DWInfo_ENQUIRYLIST_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"DWInfo_NOANSWER"}]}];
              break;
            case "DWPut" : 
              if(dwPut_list) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwPut_list,"randomtext":" คุณต้องการถาม DW01 PUT ใดค่ะ","payload":"DWPut_ENQUIRYLIST_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"DWPut_NOANSWER"}]}];
              break;
            case "DWCall" : 
              if(dwCall_list) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwCall_list,"randomtext":" คุณต้องการถาม DW01 CALL ใดค่ะ","payload":"DWCall_ENQUIRYLIST_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"DWCall_NOANSWER"}]}];
              break;
          }
        }
      }else if(dwlist.length === 1){
        var ans = DW_name + " เป็น DW01 อ้างอิง " + UnderlyingSym +" ชนิด "+ DwType + _DW_details;

        var infostock = [{"answer": [{"functions":"sendImageMessage","image_url":_DW_URLImage},
        {"functions":"sendButton_Message","buttonType":["web_url"],"title":dw_titleURL,"info":dw_url_arry,"randomtext":ans}]}];
      }else{
        var infostock = [{"answer": [{"functions":"sendTextMessage","randomtext":" ไม่พบ DW01 ของ "+ stock_name}]}]; 
      } 
    }else{
      if(arrNoun){
        var infostock = [{"answer": [
          {"functions":"sendQuickReply","titleArray":["เปิดบัญชี","สัมมนาบัวหลวง","ข้อมูลหลักทรัพย์","ฝากเงิน"],"randomtext":"อยากรู้เรื่องไหนต่อดีค่ะ","payload":"No_Answer_TakingEnqury_QuickReply"},
          {"functions":"sendTextMessage","randomtext":_Present_StockInfo+"\n\n"+_datetotime},
          {"functions":"sendImageMessage","image_url":imgChart},{"functions":"sendTextMessage","randomtext":"ข้อมูลกราฟจาก Aspen"}
        ]}]; 
      }else{
        for(time in arrNoun){    
          switch(arrNoun[time]){
            case "Stockinfo" : 
              var infostock = [{"answer": [
                {"functions":"sendQuickReply","titleArray":["เปิดบัญชี","สัมมนาบัวหลวง","ข้อมูลหลักทรัพย์","ฝากเงิน"],"randomtext":"อยากรู้เรื่องไหนต่อดีค่ะ","payload":"No_Answer_TakingEnqury_QuickReply"},
                {"functions":"sendTextMessage","randomtext":_Present_StockInfo+"\n\n"+_datetotime},
                {"functions":"sendImageMessage","image_url":imgChart},{"functions":"sendTextMessage","randomtext":"ข้อมูลกราฟจาก Aspen"}
              ]}]; 
              break;
               case "S50DWCall" : 
              if(dwCall_list) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwCall_list,"randomtext":" คุณต้องการถาม DW ใดค่ะ","payload":"S50DWCall_ENQUIRYLIST_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"S50DWCall_NOANSWER"}]}];
              break;
            case "S50DWPut" : 
              if(dwPut_list) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwPut_list,"randomtext":" คุณต้องการถาม DW ใดค่ะ","payload":"S50DWPut_ENQUIRYLIST_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"S50DWPut_NOANSWER"}]}];
              break;
            case "DWInfo" : 
              if(dwlist) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwlist,"randomtext":" คุณต้องการถาม DW ใดค่ะ","payload":"DWInfo_ENQUIRYLIST_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"DWInfo_NOANSWER"}]}];
              break;
            case "DWPut" : 
              if(dwPut_list) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwPut_list,"randomtext":" คุณต้องการถาม DW01 PUT ใดค่ะ","payload":"DWPut_ENQUIRYLIST_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"DWPut_NOANSWER"}]}];
              break;
            case "DWCall" : 
              if(dwCall_list) 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":dwCall_list,"randomtext":" คุณต้องการถาม DW01 CALL ใดค่ะ","payload":"DWCall_ENQUIRYLIST_SELECTING"}]}];  
              else 
                var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","อ่านวิธีการใช้งาน"],"randomtext":"ไม่พบข้อมูล "+stock_name+" ที่ท่านต้องการค้นหา ","payload":"DWCall_NOANSWER"}]}];
              break;
          }
        }
      }
    }

   if(!infostock) var infostock = [{"answer": [{"functions":"sendQuickReply","titleArray":["ลองใหม่อีกครั้ง","สัมมนาบัวหลวง","ข้อมูลหลักทรัพย์","ฝากเงิน"],"randomtext":"ไม่พบข้อมูล Symbol ที่ท่านต้องการค้นหา","payload":"NoAnswer_TakingEnqury_QuickReply"}]}]; 

   var securities = infostock[Math.floor(Math.random() * infostock.length)].answer;  
   return securities;
    
  }

  function stock_info(stock_name){

    var callStockGOGL = []; 
    if(stock_name === "SET" || stock_name === "SET50" || stock_name === "SET100" || stock_name === "SETHD" || stock_name === "MAI"){
      var indexStock = "INDEXBKK";
    }else{
      var indexStock = "BKK";
    }
    
    var output = request('GET', 'http://www.google.com/finance/info?infotype=infoquoteall&q='+indexStock+':'+stock_name+'&callback=?');
    var list_output = output.getBody('utf8').substring(3);
    var result = JSON.parse(list_output);
                  
    if(output.statusCode == 200){
      var stockname = result[0].t;  
      var indexStock = result[0].e;
      var Lastprice = result[0].l; var OPenprice = result[0].op; var Chgprice = result[0].c; var PerChg = result[0].cp; 
      var datetime = result[0].lt_dts;  
      var ClosedPrice = result[0].pcls_fix; var HiPrice = result[0].hi; var LowPrice = result[0].lo;
      var PE = result[0].pe; var EPS = result[0].eps; var Vol = result[0].vo; var ComName = result[0].name;
      var day = datetime.substr(8, 2);   var month = datetime.substr(5, 2);   var year = datetime.substr(0, 4);
      var hour = datetime.substr(11, 5);
      //var imgChart = "https://www.google.com/finance/getchart?q="+stockname+"&x="+indexStock+"&p=30d&i=240";
      var imgChart = "http://s10.aspen4browser.com/chart/AspenChart.aspx?aspenkey=0123456789&symbol="+stockname+"&period=da";
      callStockGOGL.push(stockname,Lastprice,day,month,year,hour,ClosedPrice,imgChart,Chgprice,PerChg,HiPrice,LowPrice,PE,EPS,Vol,OPenprice,ComName);

    }
    return callStockGOGL;

  }

  function DW_info(dwname){
    var cun = 0; var msgDWlist = [];
    if(dwname)
    {
        var leng_dw = dwname.length;
        if(leng_dw>3 && leng_dw<6) var _dwsym = dwname.substr(0, 4); else var _dwsym = dwname; var _eachDWList = [];
        var output = request('GET', 'http://49.231.7.202:8080/axis2/services/DWService/getDW01PriceCalculationfb?response=application/json&dwSym='+_dwsym);
        var ret = JSON.parse(output.getBody('utf8'));
        var result = ret["return"];
        var length_result = ret["return"].length;

        if(length_result > 0){
          for (cun = 0; cun<length_result; cun++){
            if(result[cun].issuerSym == 'BLS'&& result[cun]){
              var eachDW =[];
              var _st = result[cun].underlyingSym;
              var _NameEng = result[cun].underlyingNameEng;
              //CHECK WHETHER UNDERLYING OF DW IS SAME AS STOCK OR NOT? AND FILTER SET50,SET50 Futures DW01 OUT
              if(_st.length > 3 && _NameEng !== "SET50" && _NameEng !== "S50+Futures"){
                var _dwn = _st.substr(0, 4);  var _lastdwn = dwname.substr(0, 4);
                var stock = _lastdwn.match(new RegExp("(?:"+_dwn+")+", "gi"));
                var distance = natural.JaroWinklerDistance(_lastdwn,_dwn);
                if(stock && distance == 1){ eachDW.push(result[cun]); msgDWlist.push(eachDW); }
              }else{
                eachDW.push(result[cun]); msgDWlist.push(eachDW);
              }
            }
          }
        }else{

          _eachDWList.push(result);
          if(_eachDWList) msgDWlist.push(_eachDWList);
        }
      }    

    return msgDWlist;  
  }
};