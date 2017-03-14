import { Component, NgZone, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {BLE} from 'ionic-native';

/*
  Generated class for the Robo page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-transfer',
  templateUrl: 'transfer.html'
})

export class TransferPage implements OnInit {
  packetTypeEncode = {set:'00',get:'01',cli:'02',response:'03',response_cli:'04',cli_length:'05',response_cli_length:'06'};
  itemTypeEncode = {DHCP:'00',IP:'01',GATEWAY:'02',SUBMASK:'03',SOCKSTATUS:'04'};
  packetTypeDecode = {'00':'set','01':'get','02':'cli','03':'response','04':'response_cli','05':'cli_length','06':'response_cli_length'};
  itemTypeDecode = {'00':'DHCP','01':'IP','02':'GATEWAY','03':'SUBMASK','04':'SOCKSTATUS'};
  ip;
  socketStatus;
  transferCha = "fff6";
  payloadlen = 17;
  telnetPacket = 'fffe01';
  cli;
  cliList = [];
  receiveList = [];
  sendList = [];

  constructor(public navCtrl: NavController, public navParams: NavParams, private zone: NgZone) {
    this.cli = navParams.get('cli');
    
  }
  ngOnInit(){
    this.startNotifyTrans();
    
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TransferPage');
  }

  sendRaw(cli){
    BLE.write(this.navParams.data[1], this.navParams.data[0], this.transferCha, this.stringToBytes(this.hexCharCodeToStr(cli))).then(
      ()=>{
        this.zone.run(() => { //running inside the zone because otherwise the view is not updated
          this.sendList.push(this.strToHexCharCode(this.hexCharCodeToStr(cli)))
      });
      },
      ()=>{
        alert("write trans error");
        console.log("Error");
      }
    );
  }
  sendPacket(str,type='get',item='SOCKSTATUS',hex=false){
  let len = str.length;
  if (hex){
    len = str.length/2;
  }
  let dataNumber = Math.ceil(len/this.payloadlen);
  
  let totalNumber = dataNumber + 2;
  let startPacket = '00' + this.numToHex(totalNumber,true) +this.packetTypeEncode[type]+this.itemTypeEncode[item];
  let endPacket = '02' + this.numToHex(len,true);
  if (type == 'get') {
    totalNumber = 2;
    startPacket = '00' + this.numToHex(totalNumber,true) +this.packetTypeEncode[type]+this.itemTypeEncode[item];
  }
  this.sendRaw(startPacket);
  if (type != 'get') {
  for (let i = 0, l = dataNumber; i < l; i++) {
    let dataPacket = '01' + this.numToHex(i,true)+str.substr(i*this.payloadlen,(i+1)*this.payloadlen);
    this.sendRaw(dataPacket);
  }
  }
  this.sendRaw(endPacket);

  }
  sendCMD(cli=undefined){
    if (cli == undefined) {
      cli = this.cli;
    }
    this.sendPacket(cli,'cli');
  }
  sendTelnet(){
    this.sendPacket(this.telnetPacket,'cli',undefined,true);
  }
  connectSocket(){
    this.sendPacket('01','set','SOCKSTATUS',true);
  }
  disconnectSocket(){
    this.sendPacket('00','set','SOCKSTATUS',true);
  }
  startNotifyTrans() {
    BLE.startNotification(this.navParams.data[1], this.navParams.data[0], this.transferCha).subscribe(
      data=>{
        
        this.zone.run(() => { //running inside the zone because otherwise the view is not updated
          this.receiveList.push(this.strToHexCharCode(this.bytesToString(data)))
      });
      },
      ()=>{
        alert("start notify trans error");
        console.log("Error");
      }
    );
  }
  stopNotifyTrans() {
    BLE.stopNotification(this.navParams.data[1], this.navParams.data[0], this.transferCha);
  }
  numToHex(num,long = true){
    let hexnumber = num.toString(16);
    let len = hexnumber.length;
    if (long){
      hexnumber = '0000' + hexnumber;
      return hexnumber.substr(hexnumber.length-4,4);
    }
    if ( len%2 == 1){
      return '0'+hexnumber;
    } else{
      return hexnumber;
    }
  }
  hexToBytes(str){
    return this.stringToBytes(this.hexCharCodeToStr(str))
  }
  bytesToHex(buffer) {
    return this.strToHexCharCode(this.bytesToString(buffer))
  }
  // ASCII only
bytesToString(buffer) {
    return String.fromCharCode.apply(null, new Uint8Array(buffer));
}
//copy from javascript
// ASCII only
stringToBytes(string) {
    let array = new Uint8Array(string.length);
    for (let i = 0, l = string.length; i < l; i++) {
        array[i] = string.charCodeAt(i);
    }
    return array.buffer;
}
strToHexCharCode(str) {
    if(str === "")
     return "";
    var hexCharCode = [];
    //hexCharCode.push("0x");    
    for(var i = 0; i < str.length; i++) {
      var singlechar = (str.charCodeAt(i)).toString(16);
      if (singlechar.length = 1) {
         hexCharCode.push("0"+singlechar);
      }
      else{
         hexCharCode.push(singlechar);
      }
    }
    return hexCharCode.join("");
   }
hexCharCodeToStr(hexCharCodeStr) {
    var trimedStr = hexCharCodeStr.trim();
    var rawStr = 
      trimedStr.substr(0,2).toLowerCase() === "0x"
      ? 
      trimedStr.substr(2) 
      : 
      trimedStr;
    var len = rawStr.length;
    if(len % 2 !== 0) {
     alert("Illegal Format ASCII Code!");
        return "";
    }
    var curCharCode;
    var resultStr = [];
    for(var i = 0; i < len;i = i + 2) {
     curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
     resultStr.push(String.fromCharCode(curCharCode));
    }
    return resultStr.join("");
   }

}