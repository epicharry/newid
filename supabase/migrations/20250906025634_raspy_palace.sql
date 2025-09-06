@@ .. @@
 CREATE POLICY "Users can manage own folder media"
   ON user_folder_media
   FOR ALL
   TO authenticated
   USING (folder_id IN (SELECT id FROM user_folders WHERE user_id = auth.uid()));
+
+-- Create a function to handle new user registration
+CREATE OR REPLACE FUNCTION handle_new_user()
+RETURNS TRIGGER AS $$
+BEGIN
+  INSERT INTO public.user_profiles (id, username)
+  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
+  RETURN NEW;
+END;
+$$ LANGUAGE plpgsql SECURITY DEFINER;
+
+-- Create a trigger to automatically create user profile on signup
+CREATE TRIGGER on_auth_user_created
+  AFTER INSERT ON auth.users
+  FOR EACH ROW EXECUTE FUNCTION handle_new_user();