
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// import { Register } from './components/register/register';
import { RegisterConfirmation } from './components/register-confirmation/register-confirmation';
import { ConfirmEmail } from './components/confirm-email/confirm-email';
import { EmailConfirmed } from './components/email-confirmed/email-confirmed';
import { Login } from './components/login/login';
import { Profile } from './components/profile/profile';
import { AuthGuard } from './guards/auth-guard';
import { ResendCofirmation } from './components/resend-cofirmation/resend-cofirmation';
import { ResendSuccess } from './components/resend-success/resend-success';
import { Error } from './components/error/error';
import { RolesListComponent } from './components/roles-list/roles-list';
import { RoleForm } from './components/role-form/role-form';
import { RolesAdd } from './components/roles-add/roles-add';
import { UsersListComponent } from './components/users-list/users-list';
import { UserEditComponent } from './components/user-edit/user-edit';
import { UserCreateComponent } from './components/user-create/user-create';
import { AuditLogs } from './components/audit-logs/audit-logs';
import { CmsList } from './components/cms-list/cms-list';
import { CmsAdd } from './components/cms-add/cms-add';
import { CmsEdit } from './components/cms-edit/cms-edit';
import { Unauthorized } from './components/unauthorized/unauthorized';
import { EmailTemplatesListComponent } from './components/email-templates-list/email-templates-list';
import { EmailTemplateAdd } from './components/email-template-add/email-template-add';
import { EmailTemplateEdit } from './components/email-template-edit/email-template-edit';
import { permissionGuard } from './guards/permission.guard-guard';
import { AppLayoutComponent } from './components/app-layout/app-layout';
import { DashboardComponent } from './components/dashboard/dashboard';
import { ForgotPassword } from './components/forgot-password/forgot-password';
import { ResetPassword } from './components/reset-password/reset-password';


export const routes: Routes = [
  // -------------------------------
  // 🔓 Public routes (no auth)
  // -------------------------------

  { path: 'account/forgot-password', component: ForgotPassword },
  { path: 'account/reset-password', component: ResetPassword },

  // { path: 'register', component: Register },
  { path: 'register-confirmation', component: RegisterConfirmation },
  { path: 'confirm-email', component: ConfirmEmail },
  { path: 'email-confirmed', component: EmailConfirmed },
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  { path: 'login', component: Login },
  { path: 'resend-confirmation', component: ResendCofirmation },
  { path: 'resend-success', component: ResendSuccess },
  { path: 'error', component: Error },
  { path: 'unauthorized', component: Unauthorized },

  // -------------------------------
  // 🔐 Protected routes (inside layout)
  // -------------------------------
  {
    path: '',
    component: AppLayoutComponent, // Common layout (sidebar, topbar)
    canActivate: [AuthGuard],
    children: [

      { path: 'dashboard', component: DashboardComponent },
      { path: 'profile', component: Profile },

      // Users
      { path: 'users', component: UsersListComponent, canActivate: [permissionGuard], data: { permission: 'Users.List' } },
      { path: 'users/create', component: UserCreateComponent, canActivate: [permissionGuard], data: { permission: 'Users.Add' } },
      { path: 'users/:id/edit', component: UserEditComponent, canActivate: [permissionGuard], data: { permission: 'Users.Edit' } },

      // Roles
      { path: 'roles', component: RolesListComponent, canActivate: [permissionGuard], data: { permission: 'Roles.List' } },
      { path: 'roles/add', component: RolesAdd, canActivate: [permissionGuard], data: { permission: 'Roles.Add' } },
      { path: 'roles/edit/:id', component: RoleForm, canActivate: [permissionGuard], data: { permission: 'Roles.Edit' } },

      // CMS
      { path: 'cms', component: CmsList, canActivate: [permissionGuard], data: { permission: 'CMS.List' } },
      { path: 'cms/add', component: CmsAdd, canActivate: [permissionGuard], data: { permission: 'CMS.Add' } },
      { path: 'cms/edit/:id', component: CmsEdit, canActivate: [permissionGuard], data: { permission: 'CMS.Edit' } },

      // Email Templates
      { path: 'email-templates', component: EmailTemplatesListComponent, canActivate: [permissionGuard], data: { permission: 'EmailTemplates.List' } },
      { path: 'email-templates/add', component: EmailTemplateAdd, canActivate: [permissionGuard], data: { permission: 'EmailTemplates.Add' } },
      { path: 'email-templates/edit/:id', component: EmailTemplateEdit, canActivate: [permissionGuard], data: { permission: 'EmailTemplates.Edit' } },

      // Audit Logs
      { path: 'audit-logs', component: AuditLogs, canActivate: [permissionGuard], data: { permission: 'AuditLogs.List' } },

      // Default route inside layout
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // 
  // Fallback (anything else)
  { path: '**', redirectTo: 'dashboard' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }

