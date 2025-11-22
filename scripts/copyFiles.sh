> ../../javascript.txt
for file in ../frontend/static/*.js; do
  echo "// ==== $file ====" >> ../../javascript.txt
  cat "$file" >> ../../javascript.txt
  echo -e "\n\n" >> ../../javascript.txt
done
> ../../html.txt
for file in ../frontend/template/*.html; do
  echo "// ==== $file ====" >> ../../html.txt
  cat "$file" >> ../../html.txt
  echo -e "\n\n" >> ../../html.txt
done
> ../../css.txt
for file in ../frontend/static/*.css; do
  echo "// ==== $file ====" >> ../../css.txt
  cat "$file" >> ../../css.txt
  echo -e "\n\n" >> ../../css.txt
done
cp ../backend/webserver/app.py ../../app.py
