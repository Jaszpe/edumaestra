# EduMaestra 🌸

Aplicación web estática para gestión de **Educación Inicial** (3, 4 y 5 años).
Construida con HTML, CSS y JavaScript puro. Sin backend y sin base de datos.

## ✨ Características

- 🎀 Diseño rosado, infantil y responsive con fuentes redondeadas (Baloo 2 + Quicksand).
- 🔐 **Login de maestra**: usuario `JARET AMPARO` · contraseña `jaret123`.
- 👨‍👩‍👧 **Portal de familias**: registro con correo, selección de salón y búsqueda del hijo/a.
- 📰 **EDUNOTICIAS**: carrusel de 4 imágenes (`img/1.jpg` … `img/4.jpg`) con botón ✕ para cerrarlo.
- 👩‍🎓 90 estudiantes de demostración (30 por salón: 3, 4 y 5 años).
- 📋 Asistencia diaria por salón (Presente / Ausente / Tardanza / Justificado).
- 📝 Evaluaciones por área con niveles AD / A / B / C.
- ⚠️ Registro de incidencias.
- 📊 Reportes con porcentajes y barras animadas.
- 💾 Respaldo y restauración en JSON + exportación CSV.
- 🎉 Animaciones, confeti y microinteracciones.

## 📁 Estructura

```
/
├── index.html
├── _headers
├── css/style.css
├── js/storage.js   (datos, semilla demo y utilidades)
├── js/auth.js      (login de maestra y familias)
├── js/app.js       (panel de la maestra)
├── js/parent.js    (portal de familias)
├── img/            (opcional: 1.jpg … 4.jpg para EDUNOTICIAS)
└── README.md
```

## 🖼️ Imágenes de EDUNOTICIAS

Crea una carpeta `img/` en la raíz y coloca:

```
img/1.jpg
img/2.jpg
img/3.jpg
img/4.jpg
```

También funciona con `.png` (el sistema intenta primero `.jpg` y luego `.png`).
Si no existen, se muestra un fondo pastel con un emoji como respaldo.

## 🚀 Ejecutar localmente

No necesitas Node.js. Abre `index.html` en tu navegador
o usa cualquier servidor estático.

## 🌐 Publicar en GitHub Pages

1. Crea el repositorio (por ejemplo `edumaestra`).
2. Sube todo el contenido.
3. Ve a **Settings → Pages**.
4. En *Source* elige **Deploy from a branch**.
5. Selecciona `main` y `/ (root)`.
6. Guarda y espera unos segundos.

## ☁️ Publicar en Cloudflare Pages

1. Sube el proyecto a GitHub.
2. Crea un proyecto en Cloudflare Pages conectado al repo.
3. Framework preset: **None**.
4. Build command: vacío.
5. Build output directory: `/`.

## ⚠️ Importante sobre los datos

EduMaestra usa `localStorage`. Los datos viven en **el navegador**, no en GitHub.
Si cambias de dispositivo o borras el almacenamiento, usa **Respaldar datos** y
luego **Restaurar** en el nuevo navegador.

Las cuentas de familias también se guardan en `localStorage` de ese mismo navegador.

## 🔮 Próximas fases

- Importar/exportar Excel `.xlsx`.
- Generación de PDF por estudiante.
- Gráficos de progreso por competencia.
- Conclusiones descriptivas por nivel.
- PWA offline instalable.
- Notificaciones a familias.
