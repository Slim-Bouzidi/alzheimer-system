FROM nginx:alpine
# We only copy the final build folder
COPY dist/alzheimer-angular/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
