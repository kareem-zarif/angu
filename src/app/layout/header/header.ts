import { Component } from '@angular/core';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.html',
  styleUrl: './header.css'
})
export class Header {
  selectedLang = { code: 'en', label: 'Eng' };

changeLang(code: string, label: string) {
  this.selectedLang = { code, label };


  // لو بتستخدم ngx-translate أو أي مكتبة ترجمة:
  // this.translate.use(code);
}


}
