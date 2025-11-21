import { AbstractControl, ValidationErrors } from "@angular/forms";

export function fileValidator(
    allowedExtensions:string[]=['jpg','jpeg','png','jfif','tif'],
    maxSizeMB:number=5  
){
    return (control:AbstractControl):ValidationErrors | null => {
        const file:File = control.value;
        if(!file){
            return null;
        }
       
        const ext = file.name.split('.').pop()?.toLowerCase();
        if(!ext || !allowedExtensions.includes(ext)){
            return {invalidType: true};
        }

        const maxBytes = maxSizeMB * 1024 * 1024;
        if(file.size > maxBytes){
            return {maxSizeExceeded: true};
        }
        return null;
    };
}