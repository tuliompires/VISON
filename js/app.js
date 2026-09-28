import { SchemaModel } from './models/schema-model.js';
import { SchemaView } from './views/schema-view.js';
import { FormView } from './views/form-view.js';
import { AppController } from './controllers/app-controller.js';
import { storageService } from './services/storage-service.js';
import { applyTranslations, setLanguage } from './i18n.js';
import { applyTheme, getTheme, setTheme } from './services/theme-service.js';
import { installFormTabs } from './controllers/form-tabs-controller.js';

applyTheme(getTheme());
installFormTabs(AppController);

const model = new SchemaModel();
const saved = storageService.load();
if (saved) { model.importSchema(saved); model.markSaved(); }
const view = new SchemaView(model);
const formView = new FormView(document.querySelector('#form-root'));
const controller = new AppController(model, view, formView);
controller.initFileInput();
applyTranslations();
document.addEventListener('languagechange',()=>{applyTranslations();view.render();formView.refreshLanguage()});
document.querySelector('#language-select').addEventListener('change',e=>setLanguage(e.target.value));
document.querySelector('#theme-select').value=getTheme();
document.querySelector('#theme-select').addEventListener('change',e=>setTheme(e.target.value));

const restoreStatus = storageService.getStatus();
if (!restoreStatus.ok) view.showMessage(restoreStatus.message, 'error');
