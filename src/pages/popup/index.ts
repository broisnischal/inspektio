import { mount } from 'svelte'
import Popup from './component/Popup.svelte'
import '../../app.css'

export const popup = mount(Popup, {
    target: document.getElementById('app') as HTMLElement
}) 
 