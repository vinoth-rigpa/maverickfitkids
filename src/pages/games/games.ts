import { Component, ElementRef, ViewChild } from '@angular/core';
import { Platform, IonicPage, NavController, NavParams, AlertController, LoadingController } from 'ionic-angular';
import { AppConfig } from '../../config/config';
import { DataProvider } from '../../providers/data/data';
import { Storage } from '@ionic/storage';
import { DatabaseProvider } from '../../providers/database/database';

@IonicPage()
@Component({
  selector: 'page-games',
  templateUrl: 'games.html',
})
export class GamesPage {
  unregisterBackButtonAction: any;
  gameContent: any;
  responseData: any;
  userDetails: any;
  imgPreview = 'assets/imgs/no_image.png';
  @ViewChild('musicaudio') musicaudio: ElementRef;
  private musicAudio: HTMLAudioElement;
  userList: any;
  isPlaying: boolean = false;
  music_icon: any = 'assets/imgs/music_icon_gray.png';
  constructor(public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public navCtrl: NavController,
    public navParams: NavParams,
    public platform: Platform,
    public storage: Storage,
    public databaseprovider: DatabaseProvider,
    public dataService: DataProvider) {
    this.databaseprovider.getDatabaseState();
    this.storage.get('userDetails')
      .then((res: any) => {
        if (res) {
          this.userDetails = res;
          console.log(this.userDetails);
          this.checkuserMusic();
          let loader = this.loadingCtrl.create({
            spinner: 'ios',
            content: ''
          });
          loader.present();
          this.dataService.getStudentGamesDetails(this.userDetails).then((result) => {
            loader.dismiss();
            this.responseData = result;
            console.log(this.responseData);
            if (this.responseData.returnStatus != 0) {
              console.log(this.responseData.gameContent);
              this.gameContent = (this.responseData.gameContent).replace(/\/maverick\/Directory\/Image\//g, AppConfig.SITE_URL + 'maverick/Directory/Image/');
              var strMessage1 = document.getElementById("sessions-content");
              strMessage1.innerHTML = (this.gameContent).replace(/(?:\r\n | \r | \n)/g, '<br>');
            } else if (this.responseData.returnStatus == 0) {
              console.log('returnStatus=>0');
              const alert = this.alertCtrl.create({
                message: this.responseData.returnMessage,
                buttons: [{
                  text: 'Ok',
                  handler: () => {
                    this.goHome();
                  }
                }],
                enableBackdropDismiss: false
              });
              alert.present();
            }
          }, (err) => {
            console.log(err);
            loader.dismiss();
            const alert = this.alertCtrl.create({
              message: AppConfig.API_ERROR,
              buttons: [{
                text: 'Ok',
                handler: () => { }
              }]
            });
            alert.present();
          });
        }
      });
  }
  async checkuserMusic() {
    this.userList = await this.databaseprovider.selectUserById(this.userDetails.studentId).then(res => res);
    if (this.userList) {
      if (this.userList[0].playlist) {
        this.musicAudio = this.musicaudio.nativeElement;
        this.musicAudio.src = this.userList[0].playlist;
        this.music_icon = 'assets/imgs/music_icon_play.png';
      } else {
        this.music_icon = 'assets/imgs/music_icon_gray.png';
      }
    }
  }

  toggleAudio() {
    if (this.isPlaying) {
      this.stopAudio();
    } else {
      this.startAudio();
    }
    console.log("isPlaying", this.isPlaying);
  }

  startAudio() {
    this.isPlaying = true;
    this.musicAudio.play();
    this.music_icon = 'assets/imgs/music_icon_pause.png';
  }

  stopAudio() {
    if (this.musicAudio) {
      this.musicAudio.pause();
      this.musicAudio.currentTime = 0;
    }
    this.isPlaying = false;
    this.music_icon = 'assets/imgs/music_icon_play.png';
  }

  finishGames() {
    this.dataService.markStarForStudent(this.userDetails, 9).then((result) => {
      this.responseData = result;
      console.log(this.responseData.starList);
      if (this.responseData.returnStatus != 0) {
        this.navCtrl.setRoot("StarRatingPage", { "starList": this.responseData.starList });
      } else if (this.responseData.returnStatus == 0) {
        console.log('returnStatus=>0');
        const alert = this.alertCtrl.create({
          message: this.responseData.returnMessage,
          buttons: [{
            text: 'Ok',
            handler: () => {
              //this.navCtrl.pop();
            }
          }],
          enableBackdropDismiss: false
        });
        alert.present();
      }

    }, (err) => {
      console.log(err);
      const alert = this.alertCtrl.create({
        message: AppConfig.API_ERROR,
        buttons: [{
          text: 'Ok',
          handler: () => { }
        }]
      });
      alert.present();
    });
  }

  goHome() {
    this.navCtrl.setRoot("HomePage");
  }

  ionViewDidLoad() {
    this.storage.get('imgPreview')
      .then((res: any) => {
        if (res) {
          this.imgPreview = res;
          console.log("Img=>", this.imgPreview);
          let cusid_ele = document.getElementsByClassName('profile-avatar');
          for (let i = 0; i < cusid_ele.length; ++i) {
            let item = cusid_ele[i];
            item.setAttribute("style", "background-image: url(" + this.imgPreview + ");");
          }
        }
      });
    this.initializeBackButtonCustomHandler();
  }

  ionViewWillLeave() {
    console.log('HomePage Leave-->');
    this.unregisterBackButtonAction && this.unregisterBackButtonAction();
  }

  initializeBackButtonCustomHandler(): void {
    this.unregisterBackButtonAction = this.platform.registerBackButtonAction(() => {
      console.log('Prevent Back Button Page Change-->');
      this.goHome();
    });
  }
  goPage(pmPage) {
    this.navCtrl.setRoot(pmPage);
  }

  playMusic() {
    console.log("playMusic clicked");
    this.toggleAudio();
  }
}
