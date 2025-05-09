document.addEventListener("DOMContentLoaded", function() {
    let imageFiles = {};

    document.getElementById('html-file-input').addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                document.getElementById('html-input').value = e.target.result;
                updatePreview(e.target.result);
            };
            reader.readAsText(file);
        }
    });
    
    document.getElementById('html-input').addEventListener('input', function() {
        updatePreview(this.value);
    });
    
    document.getElementById('image-input').addEventListener('change', function(event) {
        const fileList = event.target.files;
        const imageList = document.getElementById('image-list');
        imageList.innerHTML = '';
        imageFiles = {};
    
        Array.from(fileList).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                imageFiles[file.name] = e.target.result;
                const listItem = document.createElement('li');
                listItem.textContent = file.name;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = 'x';
                removeBtn.classList.add('remove-btn');
                removeBtn.onclick = function() {
                    delete imageFiles[file.name];
                    listItem.remove();
                };
                listItem.appendChild(removeBtn);
                imageList.appendChild(listItem);
            };
            reader.readAsDataURL(file);
        });
    });
    
    function updatePreview(html) {
        const preview = document.getElementById('html-preview');
        preview.innerHTML = html;
    }
    
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    function generateEML() {
        let htmlContent = document.getElementById('html-input').value.trim();
        const from = document.getElementById('from-input').value.trim();
        const subject = document.getElementById('subject-input').value.trim();
    
        if (!validateEmail(from)) {
            alert('Por favor ingresá un correo válido en el campo "From".');
            return;
        }
    
        if (!htmlContent) {
            alert('El campo HTML no puede estar vacío.');
            return;
        }
    
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
    
        const favicon = doc.querySelector('link[rel="icon"]');
        if (favicon) favicon.remove();
    
        let boundary = "boundary-example";
        let imageIndex = 1;
        let imageData = [];
    
        doc.querySelectorAll('img').forEach(img => {
            const src = img.getAttribute('src');
            if (imageFiles[src]) {
                const base64Data = imageFiles[src].split(',')[1];
                const mimeType = imageFiles[src].split(';')[0].split(':')[1];
                const cidName = `image${imageIndex}`;
                img.setAttribute('src', `cid:${cidName}`);
                imageData.push({ cid: cidName, mimeType, filename: src, base64: base64Data });
                imageIndex++;
            }
        });
    
        let emlContent = `From: ${from}\nTo: \nSubject: ${subject}\nMIME-Version: 1.0\nContent-Type: multipart/related; boundary="${boundary}"\n\n--${boundary}\nContent-Type: text/html; charset="utf-8"\nContent-Transfer-Encoding: 7bit\n\n${doc.documentElement.outerHTML}\n`;
    
        imageData.forEach(img => {
            emlContent += `\n--${boundary}\nContent-Type: ${img.mimeType}\nContent-ID: <${img.cid}>\nContent-Transfer-Encoding: base64\nContent-Disposition: inline; filename="${img.filename}"\n\n${img.base64}\n`;
        });
    
        emlContent += `\n--${boundary}--`;
    
        const blob = new Blob([emlContent], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'generated.eml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    document.getElementById('generate-btn').addEventListener('click', generateEML);
    
    AOS.init();  
});

