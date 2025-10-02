> javascript.txt
for file in ../frontend/static/*.js; do
  echo "// ==== $file ====" >> javascript.txt
  cat "$file" >> javascript.txt
  echo -e "\n\n" >> javascript.txt
done
> html.txt
for file in ../frontend/template/*.html; do
  echo "// ==== $file ====" >> html.txt
  cat "$file" >> html.txt
  echo -e "\n\n" >> html.txt
done
cp ../frontend/static/style.css ./style.css
