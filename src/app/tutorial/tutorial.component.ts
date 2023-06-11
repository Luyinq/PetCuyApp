import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { register } from 'swiper/element/bundle';
import { ChangeDetectorRef } from '@angular/core';
import { IonicSlides } from '@ionic/angular';
import { Swiper } from 'swiper';
import { Router } from '@angular/router';
register();

@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrls: ['./tutorial.component.scss'],
})
export class TutorialComponent  implements OnInit {
  @ViewChild('swiper')
  swiperRef: ElementRef | undefined;
  swiper?: Swiper;
  isLastSlide: boolean = false;
  isFirstSlide: boolean = true;

  images = [
    '../../assets/imagenes/tutorial/tutorial-uno.png',
    '../../assets/imagenes/tutorial/tutorial-dos.png',
    '../../assets/imagenes/tutorial/tutorial-tres.png',
    '../../assets/imagenes/tutorial/tutorial-cuatro.png',
  ];

  constructor(private cdr: ChangeDetectorRef, private router: Router) { }

  ngOnInit() {}

  swiperSlideChanged(event : any) {
    this.isLastSlide = this.swiper?.isEnd || false;
    this.isFirstSlide = this.swiper?.isBeginning || false;
  }
 
  swiperReady() {
    this.swiper = this.swiperRef?.nativeElement.swiper;
  }
 
  goNext() {
    this.swiper?.slideNext();
  }
 
  goPrev() {
    this.swiper?.slidePrev();
  }

  handleOkButtonClick(){
    localStorage.setItem('tutorial', 'true')
    this.router.navigate(["/login"])
  }
}
