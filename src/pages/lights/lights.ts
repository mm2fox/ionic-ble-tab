import { Component, NgZone, OnInit } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {BLE} from 'ionic-native';
/*
  Generated class for the Lights page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-lights',
  templateUrl: 'lights.html'
})
export class LightsPage implements OnInit {
  batteryLevelUUID = "2a19";
  batteryLevel = "";
  batteryLevelArry;
  batteryLevelNotify;

  constructor(public navCtrl: NavController, public navParams: NavParams,private zone: NgZone) {}
  ngOnInit(){
    this.startNotifyBattery();
  }
  ionViewDidLoad() {
    console.log('ionViewDidLoad BatteryPage');
  }
  readBattery() {
    this.batteryLevel = "";
    console.log('readBattery');
    BLE.read(this.navParams.data[1], this.navParams.data[0], this.batteryLevelUUID).then(
      battery=>{
        console.log("read battery successfuly"+battery);
        this.batteryLevelArry = new Uint8Array(battery);
        this.zone.run(() => { //running inside the zone because otherwise the view is not updated
        this.batteryLevel = this.batteryLevelArry[0]+"%"
        });
      },
      ()=>{
        alert("read battery error");
        console.log("Error");
      }
    );
    
  }
  startNotifyBattery() {
    BLE.startNotification(this.navParams.data[1], this.navParams.data[0], this.batteryLevelUUID).subscribe(
      data=>{
        this.batteryLevelArry = new Uint8Array(data);
        this.zone.run(() => { //running inside the zone because otherwise the view is not updated
          this.batteryLevel = this.batteryLevelArry[0]+"%"
      });
      this.batteryLevelNotify = true;
      },
      ()=>{
        alert("start notify battery level error");
        console.log("Error");
      }
    );
  }
  stopNotifyBattery() {
    BLE.stopNotification(this.navParams.data[1], this.navParams.data[0], this.batteryLevelUUID);
    this.batteryLevelNotify = false;
  }
  notifyBatteryLevel() {
    alert(this.batteryLevelNotify);


  }

}
