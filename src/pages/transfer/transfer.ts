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
  battService = '180f';
  battLevelCha = '2a19';
  payloadlen = 17;
  telnetPacket = 'fffc18fffc20fffc23fffc27fffc01fffc1ffffe05fffc21';
  cli;
  cliList = [];
  receiveList = [];
  sendList = [];

  deviceId;
  deviceName;
  deviceRSSI;
  result = '';
  batteryLevel;
  recordButton = 'Start Record';
  
  pagingButton = 'Disable Paging';
  notifyTransCharButton = 'Start Notify';
  notifyBatteryButton = 'Start Notify Battery Level';
  connectBLEButton = 'ConnectBLE';
  BLEConnected = true;
  notifyTransTimestamp;
  recordStarted = false;
  lastrecordStatus = false;
  recordPacketesNum;
  recordPacketesLength;
  lastReceiveTime;
  firstReceiveTime;

  constructor(public navCtrl: NavController, public navParams: NavParams, private zone: NgZone) {
    this.cli = navParams.get('cli');
  }
  ngOnInit(){
    this.deviceId = this.navParams.data.id;
    this.deviceName = this.navParams.data.name;
    this.deviceRSSI = this.navParams.data.rssi;
    this.discoverServices();
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad TransferPage');
  }
timestamp() {
    let currenttime = new Date();
    return [currenttime.toString().split(" ")[4]+"."+currenttime.getMilliseconds(),currenttime.getTime()];
    }
  sendRaw(cli){
    //alert("send raw data: "+cli);
    BLE.write(this.deviceId, this.transferService, this.transferCha, this.stringToBytes(this.hexCharCodeToStr(cli))).then(
      ()=>{
        //alert("write trans ok");
        
        this.zone.run(() => { //running inside the zone because otherwise the view is not updated
          this.sendList.reverse().push(this.timestamp()[0]+' : '+this.strToHexCharCode(this.hexCharCodeToStr(cli)));
          this.sendList.reverse()
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
    if (blename == undefined || blename == ''){
      let ms = new Date().getMilliseconds();
      blename = "MAC_"+this.deviceId.substr(12,5)+"-"+ms.toString();
    }
    this.sendPacket(blename,'set','BLENAME');
    this.result = blename;
  }

  changeIP(cli){
    let ip = this.cli;
    if (ip == undefined||ip==''){
      ip = "172.16.0.200/255.255.255.0"
      if (cli != undefined){
        ip = cli;
      }
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
    this.result = "change IP: "+ip + " HEX " + iphex+maskhex
  }
  changeTargetIP(cli){
    
    let targetip = this.cli;
    if (targetip == undefined || targetip == ''){
      targetip = "172.16.0.2/5000";
      if (cli != undefined){
        targetip = cli;
      }
    }
    let targetipgroup = targetip.split("/");
    let targetiphex = this.ipToHex(targetipgroup[0]);
    let porthex = '0017';//default port 23
    if (targetipgroup[1]!=undefined){
      porthex = this.numToHex(targetipgroup[1],true);
    }
    this.sendPacket(targetiphex+porthex,'set','TARGETIP',true);
    this.result = "change Target IP: "+ targetip + " HEX " +targetiphex+porthex;

  }
  getIP(){
    this.sendPacket('00','get','IP',true);

  }
  getTargetIP(){
    this.sendPacket('00','get','TARGETIP',true);

  }
  
  notifyTrans(){
    if (this.notifyTransCharButton == 'Start Notify') {
      this.startNotifyTrans();
    } else {
      this.stopNotifyTrans();
    }

  }

  notifyBattery(){
    if (this.notifyBatteryButton == 'Start Notify Battery Level') {
      this.startNotifyBatteryLevel()
    }else{
      this.stopNotifyBatteryLevel()
    }
  }
  discoverServices(){
    console.log("trying to connect");
    BLE.connect(this.deviceId).subscribe(peripheralData => {
        console.log(peripheralData);
        this.BLEConnected = true;
        this.zone.run(
          ()=>{
            this.connectBLEButton = 'DisconnectBLE';
          });
        
        this.startNotifyTrans();
        this.startNotifyBatteryLevel();
      },
      peripheralData => {
        alert("Device not connected in discover"+this.deviceId)
        console.log('disconnected');
        this.BLEConnected = false;
        this.connectBLEButton = 'ConnectBLE';
      });
  }
  startNotifyTrans() {
    if (!this.BLEConnected){
      alert("BLE not connected " + this.deviceId);
      return
    }
    this.notifyTransCharButton = 'Stop Notify';
    BLE.startNotification(this.deviceId, this.transferService, this.transferCha).subscribe(
      data=>{
        //this.notifyBatteryButton = 'Stop Notify';
        let timestamp = this.timestamp();
        let datalength = this.bytesToString(data).length;
        this.zone.run(() => {
        this.notifyTransTimestamp = timestamp[0];
        });
          if (this.recordStarted){
          //this.result = 'Received Notification on ' + timestamp[0];
            this.recordPacketesNum = this.recordPacketesNum + 1;
            this.recordPacketesLength = this.recordPacketesLength + datalength;
            if (this.lastrecordStatus) {
              this.lastReceiveTime = timestamp[1];
            } else {
              this.firstReceiveTime = timestamp[1];
            }
          } else {
            this.zone.run(() => { //running inside the zone because otherwise the view is not updated
          this.receiveList.reverse().push(timestamp[0]+' : '+this.strToHexCharCode(this.bytesToString(data)));
          this.receiveList.reverse();
        });
          }
          this.lastrecordStatus = this.recordStarted;
      
      },
      ()=>{
        alert("start notify trans error");
        this.notifyTransCharButton = 'Start Notify';
        console.log("Error");
      }
    );
  }
  stopNotifyTrans() {
    if (!this.BLEConnected){
      alert("BLE not connected " + this.deviceId);
      return
    }
    BLE.stopNotification(this.deviceId, this.transferService, this.transferCha).then(
      ()=>{
        this.notifyTransCharButton = 'Start Notify';
      },
      ()=>{
        alert("Stop Notify Failed "+this.deviceId);
        this.notifyTransCharButton = 'Stop Notify';
      }
    );
  }
  startNotifyBatteryLevel() {
    if (!this.BLEConnected){
      alert("BLE not connected " + this.deviceId);
      return
    }
    this.notifyBatteryButton = 'Stop Notify Battery Level';
    BLE.startNotification(this.deviceId, this.battService, this.battLevelCha).subscribe(
      data=>{
        let batteryLevelArry = new Uint8Array(data);
        this.zone.run(() => {
        //this.result = "Battery Level is "+batteryLevelArry[0]+"%, update on "+this.timestamp()[0];
        this.batteryLevel = batteryLevelArry[0];
        });
      },
      ()=>{
        alert("Start Notify Battery Failed "+this.deviceId);
        this.notifyBatteryButton = 'Start Notify Battery Level';
      }
    );
  }
  stopNotifyBatteryLevel() {
    if (!this.BLEConnected){
      alert("BLE not connected " + this.deviceId);
      return
    }
    BLE.stopNotification(this.deviceId, this.battService, this.battLevelCha).then(
      () => {
        this.notifyBatteryButton = 'Start Notify Battery Level'
      },
      () => {
        alert("Stop Notify Battery Failed "+this.deviceId);
        this.notifyBatteryButton = 'Stop Notify Battery Level';
      }
    );
    
  }
getBLEStatus(){
  BLE.isConnected(this.deviceId).then(
    status=>{
      if (status){
        alert("BLE status is "+status);
      } else {
        alert("BLE status is OK");
      }
      this.connectBLEButton = 'DisconnectBLE';
      this.BLEConnected = true;
    },
    (reason)=>{
      alert("Failed to get BLE status "+reason);
      this.connectBLEButton = 'ConnectBLE';
      this.notifyBatteryButton = 'Start Notify Battery Level';
      this.notifyTransCharButton = 'Start Notify';
      this.BLEConnected = false;
    }
  )
}
  connectBLE() {
    
    if (this.connectBLEButton == 'ConnectBLE') {
      BLE.connect(this.deviceId).subscribe(
        (value) => {
          alert("BLE connect successfully on "+value.name);
          this.zone.run(()=>{
          this.connectBLEButton = 'DisconnectBLE';
          this.deviceName = value.name;
          this.deviceRSSI = value.rssi;
          });
          this.BLEConnected = true;
        },
        (error) => {
          alert("Connect BLE failed "+JSON.stringify(error));
          this.zone.run(()=>{
              this.connectBLEButton = 'ConnectBLE';
          });
        this.BLEConnected = false;
        
        },
        ()=>{
          alert("BLE connect complete");
        }

      )

    } else {
      BLE.disconnect(this.deviceId).then(
        (value)=>{
          
          alert("disconnect BLE "+JSON.stringify(value));
          this.connectBLEButton = 'ConnectBLE';
          this.notifyBatteryButton = 'Start Notify Battery Level';
          this.notifyTransCharButton = 'Start Notify';
          this.BLEConnected = false;
        },
        (reason)=>{
          alert("Disconnect BLE failed "+reason);
          //this.connectBLEButton = 'DisconnectBLE';
          
        }
      )
    }
  }
  readBatteryLevel(){
    if (!this.BLEConnected){
      alert("BLE not connected " + this.deviceId);
      return
    }
    BLE.read(this.deviceId,this.battService,this.battLevelCha).then(
      data => {
        let batteryLevelArry = new Uint8Array(data);
        this.result = "Battery Level is "+batteryLevelArry[0]+"% update on "+this.timestamp()[0];
        this.batteryLevel = batteryLevelArry[0];
        alert("Battery Level is "+batteryLevelArry[0]+"%");
      },
      reason => {
        alert("Read battery level failed "+reason)
      }

    )
  }
  
  clearResult(){
    this.sendList = [];
    this.receiveList = [];
    this.result = '';
  }
  startRecord(){
    if (this.recordStarted){
      this.recordButton = 'Start Record';
      this.recordStarted = false;
      let starttime = new Date(this.firstReceiveTime);
      let endtime = new Date(this.lastReceiveTime);
      let spendtime = (this.lastReceiveTime - this.firstReceiveTime)/1000;
      alert("start time: "+starttime.toString()+" last time: "+endtime.toString()+"Packets: "+this.recordPacketesNum);
      this.result ="Used Time: " + spendtime + "s, Packets length: "+this.recordPacketesLength+" Speed:"+this.recordPacketesLength/spendtime+'byte/s';
      
    } else {
      this.recordButton = 'Stop Record';
      this.recordStarted = true;
      this.result = "Click Stop Record to get result, raw list will not update during capture";
    }
    this.recordPacketesNum = 0;
    this.recordPacketesLength = 0;
  }
  sendCMDPageing(){
    if (this.pagingButton == 'Enable Paging'){
      this.pagingButton = 'Disable Paging';
      this.sendCMD('paging status enabled\n');
     } else {
       this.pagingButton = 'Enable Paging';
       this.sendCMD('paging status disabled\n');
     }

    
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