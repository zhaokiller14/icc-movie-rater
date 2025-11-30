import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { WelcomeComponent } from './welcome/welcome.component';
import { RatingComponent } from './rating/rating.component';
import { AdminComponent } from './admin/admin.component';
export const routes: Routes = [
  { path: '', component: WelcomeComponent },
  { path: 'rating', component: RatingComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }