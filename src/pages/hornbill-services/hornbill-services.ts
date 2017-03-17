import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import {BLE} from 'ionic-native';
import { RoboPage } from '../robo/robo';
import {LightsPage} from '../lights/lights';



/*
  Generated class for the HornbillServices page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-hornbill-services',
  templateUrl: 'hornbill-services.html'
})
export class HornbillServicesPage implements OnInit {

  deviceId:string="";
  deviceServices = [];
  robo_Service_UUID = "fff0";
  rgb_lights_Service_UUID = "180f";

  constructor(public navCtrl: NavController, public navParams: NavParams,private zone: NgZone) {}

  ngOnInit() {
    console.log('ionViewDidLoad HornbillServicesPage');
    console.log(this.navParams.data);
    this.deviceId = this.navParams.data;
    this.discoverServices();
  }

  discoverServices(refresher=undefined){
    console.log("trying to connect");
    BLE.connect(this.deviceId).subscribe(peripheralData => {
        console.log(peripheralData);
        this.zone.run(() => { //running inside the zone because otherwise the view is not updated
        this.deviceServices = peripheralData.services;
      });
        
        console.log(this.deviceServices);
      },
      peripheralData => {
        console.log('disconnected');
      });
      if(refresher != undefined)
          refresher.complete();
  }

  selectService(serviceId:String){
    //To Do:
    //Check the service id and call relevant functionality.

    console.log(serviceId);
    if(serviceId == this.robo_Service_UUID){
      this.navCtrl.push(RoboPage, [serviceId, this.deviceId]);
    }
    else if(serviceId == this.rgb_lights_Service_UUID){
      this.navCtrl.push(LightsPage, [serviceId, this.deviceId]);
    }
    else{
      console.log("unknown service");
    }

  }


}
