import { Component, ElementRef, Input, Output, EventEmitter, AfterViewInit, ViewChild, OnChanges } from '@angular/core';
import { fromEvent as observableFromEvent, Observable } from 'rxjs';
import { takeUntil, finalize, map, mergeMap } from 'rxjs/operators';
import { FeedbackService } from '../feedback.service';

@Component({
  standalone: false,
  selector: 'feedback-toolbar[drawColor]',
  templateUrl: './feedback-toolbar.component.html',
  styleUrls: ['./feedback-toolbar.component.css']
})
export class FeedbackToolbarComponent implements AfterViewInit, OnChanges {
  @Input()
  public drawColor!: string;
  @Output()
  public manipulate = new EventEmitter<string>();
  public disableToolbarTips = false;
  @ViewChild('toggleMove')
  private toggleMoveBtn!: ElementRef<HTMLDivElement>;
  public isSwitch = false;
  public isDragging = false;
  public vars: any = {};

  constructor(public el: ElementRef, private feedbackService: FeedbackService) {
    this.vars = feedbackService.initialVariables;
  }

  public ngAfterViewInit() {
    const elStyle = this.el.nativeElement.style;
    elStyle.position = 'absolute';
    elStyle.left = '43%';
    elStyle.top = '60%';
    this.addDragListenerOnMoveBtn();
  }

  public ngOnChanges() {
    this.isSwitch = this.drawColor !== this.feedbackService.highlightedColor;
  }

  public done() {
    this.manipulate.emit('done');
  }

  public toggleHighlight() {
    this.isSwitch = false;
    this.manipulate.emit(this.feedbackService.highlightedColor);
  }

  public toggleHide() {
    this.isSwitch = true;
    this.manipulate.emit(this.feedbackService.hiddenColor);
  }

  public addDragListenerOnMoveBtn() {
    const mouseUp = observableFromEvent(this.toggleMoveBtn.nativeElement, 'mouseup') as Observable<MouseEvent>;
    const mouseMove = observableFromEvent(document.documentElement, 'mousemove') as Observable<MouseEvent>;
    const mouseDown = observableFromEvent(this.toggleMoveBtn.nativeElement, 'mousedown') as Observable<MouseEvent>;
    const mouseDrag = mouseDown.pipe(mergeMap((md: MouseEvent) => {
      this.feedbackService.setIsDraggingToolbar(true);
      const startX = md.offsetX;
      const startY = md.offsetY;
      this.disableToolbarTips = true;
      this.isDragging = true;
      // Calculate dif with mousemove until mouseup
      return mouseMove.pipe(
        map((mm: MouseEvent) => {
          mm.preventDefault();
          return {
            left: mm.clientX - startX,
            top: mm.clientY - startY
          };
        }),
        finalize(() => {
          this.isDragging = false;
          this.disableToolbarTips = false;
          this.feedbackService.setIsDraggingToolbar(false);
        }),
        takeUntil(mouseUp));
    }));
    mouseDrag.subscribe(
      (pos) => {
        this.el.nativeElement.style.left = pos.left + 'px';
        this.el.nativeElement.style.top = pos.top + 'px';
      });
  }
}
