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
  itemTypeEncode = {DHCP:'00',IP:'01',GATEWAY:'02',TARGETIP:'03',SOCKSTATUS:'04',BLENAME:'05'};
  packetTypeDecode = {'00':'set','01':'get','02':'cli','03':'response','04':'response_cli','05':'cli_length','06':'response_cli_length'};
  itemTypeDecode = {'00':'DHCP','01':'IP','02':'GATEWAY','03':'TARGETIP','04':'SOCKSTATUS','06':'BLENAME'};
  ip;
  transferService = 'fff0';
  transferCha = "fff6";
  payloadlen = 17;
  telnetPacket = 'fffc18fffc20fffc23fffc27fffc01fffc1ffffe05fffc21';
  cli;
  cliList = [];
  receiveList = [];
  sendList = [];
  deviceId;

  constructor(public navCtrl: NavController, public navParams: NavParams, private zone: NgZone) {
    this.cli = navParams.get('cli');
  }
  ngOnInit(){
    this.deviceId = this.navParams.data;
    //alert("transferpage deviceID:" + this.deviceId);
    this.startNotifyTrans();
    
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TransferPage');
  }
timestamp() {
    let currenttime = new Date();
    return currenttime.toString().split(" ")[4]+"."+currenttime.getMilliseconds();
    }
  sendRaw(cli){
    //alert("send raw data: "+cli);
    BLE.write(this.navParams.data, this.transferService, this.transferCha, this.stringToBytes(this.hexCharCodeToStr(cli))).then(
      ()=>{
        //alert("write trans ok");
        this.zone.run(() => { //running inside the zone because otherwise the view is not updated
          this.sendList.push(this.timestamp()+' : '+this.strToHexCharCode(this.hexCharCodeToStr(cli)))
      });
      },
      ()=>{
        alert("write trans error");
        console.log("Error");
      }
    );
  }
  sendPacket(str,type='get',item='SOCKSTATUS',hex=false){
    //alert("sendPacket: "+str+"type: "+type+"hex"+hex);
  let len = str.length;
  if (hex){
    len = str.length/2;
    str = this.hexCharCodeToStr(str);
  }
  let dataNumber = Math.ceil(len/this.payloadlen);
  
  let totalNumber = dataNumber + 2;
  let startPacket = '00' + this.numToHex(totalNumber,true) +this.packetTypeEncode[type]+this.itemTypeEncode[item];
  let endPacket = '02' + this.numToHex(len,true);
  if (type == 'get') {
    totalNumber = 2;
    startPacket = '00' + this.numToHex(totalNumber,true) +this.packetTypeEncode[type]+this.itemTypeEncode[item];
    endPacket = '020000';
  }
  this.sendRaw(startPacket);
  if (type != 'get') {
  for (let i = 0, l = dataNumber; i < l; i++) {
    //alert("ready to send data"+dataNumber);
    let dataPacket = '01' + this.numToHex(i,true)+this.strToHexCharCode(str.substr(i*this.payloadlen,(i+1)*this.payloadlen));
    //alert("data packet is "+dataPacket);
    this.sendRaw(dataPacket);
  }
  }
  this.sendRaw(endPacket);

  }
  sendCMD(cli=undefined){
    if (cli == undefined) {
      cli = this.cli+"\n";
      //alert("send input cli command"+cli);
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
  socketStatus() {
    this.sendPacket('00','get','SOCKSTATUS',true);
  }
  changeBLEName() {
    let blename = this.cli;
    if (blename ==undefined){
      blename = "BLEDongleTest_V100";
    }
    this.sendPacket(blename,'set','BLENAME');
  }

  changeIP(){
    let ip = this.cli;
    if (ip == undefined){
      ip = "172.16.0.200/255.255.255.0"
    }
    let ipgroup = ip.split("/");
    ip = ipgroup[0];
    let mask = ipgroup[1];
    
    let maskhex = 'FFFFFF00';
    if (mask != undefined) {
      maskhex = this.ipToHex(mask);
    }
    let iphex = this.ipToHex(ip);
    this.sendPacket(iphex+maskhex,'set','IP',true);
  }
  changeTargetIP(){
    
    let targetip = this.cli;
    if (targetip == undefined){
      targetip = "172.16.0.2/5000";
    }
    let targetipgroup = targetip.split("/");
    let targetiphex = this.ipToHex(targetipgroup[0]);
    let porthex = '0017';//default port 23
    if (targetipgroup[1]!=undefined){
      porthex = this.numToHex(targetipgroup[1],true);
    }
    this.sendPacket(targetiphex+porthex,'set','TARGETIP',true);

  }
  getIP(){
    this.sendPacket('00','get','IP',true);

  }
  getTargetIP(){
    this.sendPacket('00','get','TARGETIP',true);

  }
  discoverServices(){
    console.log("trying to connect");
    BLE.connect(this.deviceId).subscribe(peripheralData => {
        console.log(peripheralData);
        this.startNotifyTrans();
      },
      peripheralData => {
        alert("Device not connected "+this.deviceId)
        console.log('disconnected');
      });
  }
  startNotifyTrans() {
    //alert(this.deviceId+this.transferService);
    BLE.startNotification(this.deviceId, this.transferService, this.transferCha).subscribe(
      data=>{
        
        this.zone.run(() => { //running inside the zone because otherwise the view is not updated
          this.receiveList.push(this.timestamp()+' : '+this.strToHexCharCode(this.bytesToString(data)))
      });
      },
      ()=>{
        alert("start notify trans error");
        console.log("Error");
      }
    );
  }
  stopNotifyTrans() {
    BLE.stopNotification(this.deviceId, this.transferService, this.transferCha);
  }
  ipToHex(ip){
    let ipsegments = ip.split(".");
    let iphex = [];
    for (let i=0;i<ipsegments.length;i++) {
      iphex.push(this.numToHex(ipsegments[i]));
    }
    return iphex.join("");
  }
  numToHex(num,long = false){
    let hexnumber = parseInt(num).toString(16);
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
    let hexCharCode = [];
    //hexCharCode.push("0x");    
    for(let i = 0; i < str.length; i++) {
      let singlechar = (str.charCodeAt(i)).toString(16);
      if (singlechar.length == 1) {
         hexCharCode.push("0"+singlechar);
      }
      else{
         hexCharCode.push(singlechar);
      }
    }
    return hexCharCode.join("");
   }
hexCharCodeToStr(hexCharCodeStr) {
    let trimedStr = hexCharCodeStr.trim();
    let rawStr = 
      trimedStr.substr(0,2).toLowerCase() === "0x"
      ? 
      trimedStr.substr(2) 
      : 
      trimedStr;
    let len = rawStr.length;
    if(len % 2 !== 0) {
     alert("Illegal Format ASCII Code!");
        return "";
    }
    let curCharCode;
    let resultStr = [];
    for(let i = 0; i < len;i = i + 2) {
     curCharCode = parseInt(rawStr.substr(i, 2), 16); // ASCII Code Value
     resultStr.push(String.fromCharCode(curCharCode));
    }
    return resultStr.join("");
   }

}