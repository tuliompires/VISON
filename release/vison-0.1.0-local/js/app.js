import { SchemaModel } from './models/schema-model.js';
import { SchemaView } from './views/schema-view.js';
import { AppController } from './controllers/app-controller.js';
import { storageService } from './services/storage-service.js';
import { applyTranslations, setLanguage } from './i18n.js';

const model = new SchemaModel();
const saved = storageService.load();
if (saved) { model.importSchema(saved); model.markSaved(); }
const view = new SchemaView(model);
const controller = new AppController(model, view);
controller.initFileInput();
applyTranslations();
document.addEventListener('languagechange',()=>{applyTranslations();view.render()});
document.querySelector('#language-select').addEventListener('change',e=>setLanguage(e.target.value));

const restoreStatus = storageService.getStatus();
if (!restoreStatus.ok) view.showMessage(restoreStatus.message, 'error');
