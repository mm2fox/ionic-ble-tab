import { Component, NgZone } from '@angular/core';
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
export class LightsPage {
batteryLevelUUID = "2a19";
  batteryLevel = [];
  batteryLevelArry;

  constructor(public navCtrl: NavController, public navParams: NavParams,private zone: NgZone) {}

  ionViewDidLoad() {
    console.log('ionViewDidLoad BatteryPage');
  }
  readBattery() {
    this.batteryLevel = [];
    console.log('readBattery');
    BLE.read(this.navParams.data[1], this.navParams.data[0], this.batteryLevelUUID).then(
      battery=>{
        console.log("read battery successfuly"+battery);
        this.batteryLevelArry = new Uint8Array(battery);
        this.zone.run(() => { //running inside the zone because otherwise the view is not updated
        this.batteryLevel.push(this.batteryLevelArry[0]+"%")
        });
      },
      ()=>{
        alert("read battery error");
        console.log("Error");
      }
    );
    
  }
  startNotifyBattery() {
    BLE.startNotification(this.navParams.data[1], this.navParams.data[0], this.batteryLevelUUID);
  }
  stopNotifyBattery() {
    BLE.stopNotification(this.navParams.data[1], this.navParams.data[0], this.batteryLevelUUID);
  }

}
