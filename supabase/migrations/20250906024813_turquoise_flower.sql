@@ .. @@
 CREATE POLICY "Users can read own profile"
   ON user_profiles
   FOR SELECT
   TO authenticated
   USING (auth.uid() = id);
+
+CREATE POLICY "Users can insert own profile"
+  ON user_profiles
+  FOR INSERT
+  TO authenticated
+  WITH CHECK (auth.uid() = id);
+
+CREATE POLICY "Users can update own profile"
+  ON user_profiles
+  FOR UPDATE
+  TO authenticated
+  USING (auth.uid() = id)
+  WITH CHECK (auth.uid() = id);