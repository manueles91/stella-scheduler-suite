# Pre-Migration Checklist for Enhanced Combo System

## ⚠️ IMPORTANT: Complete These Steps Before Running Migration

### 1. **Database Migration Order**
Run migrations in this specific order:

1. **First**: `20250128000007-add-primary-employee-to-combos.sql`
   - Adds `primary_employee_id` to existing combos table
   - Updates RLS policies for combos

2. **Second**: `20250128000006-create-combo-reservations.sql`
   - Creates new combo reservation tables
   - Sets up service assignment system

### 2. **Required Updates Made**

#### ✅ **Combo Creation Dashboard** (`AdminServices.tsx`)
- Added primary employee selection field
- Updated form validation to require primary employee
- Updated combo submission logic

#### ✅ **Admin Quick Access** (`AdminQuickAccess.tsx`)
- Updated "Nueva Cita" modal for combo support
- Updated "Registrar Venta" modal for combo support
- Added employee fallback logic (uses combo's primary employee if none selected)
- Added helpful user guidance for combo bookings

#### ✅ **Database Schema Updates**
- Added `primary_employee_id` to combos table
- Created combo_reservations table
- Created combo_service_assignments table
- Updated RLS policies for proper access control

#### ✅ **Type Definitions**
- Updated Supabase types to include new fields
- Added ComboServiceAssignment and ComboReservation interfaces

### 3. **What Happens After Migration**

#### **For Existing Combos**
- All existing combos will have `primary_employee_id` set to `NULL`
- **Action Required**: Update existing combos to assign primary employees
- Use the updated AdminServices dashboard to edit each combo

#### **For New Combos**
- Primary employee selection is now required
- System will automatically create service assignments
- Proper employee eligibility checking will be enforced

#### **For Bookings**
- Individual service bookings continue to work as before
- Combo bookings now create single reservations with service tracking
- Employee assignment is automatic based on combo configuration

### 4. **Post-Migration Tasks**

#### **Immediate Actions**
1. **Update Existing Combos**: Assign primary employees to all existing combos
2. **Test Combo Creation**: Create a new combo to verify the system works
3. **Test Combo Booking**: Book a combo appointment to verify the flow

#### **Verification Steps**
1. **Combo Creation**: Ensure primary employee selection works
2. **Combo Booking**: Verify single reservation creation
3. **Service Assignments**: Check that service assignments are auto-created
4. **Employee Management**: Test the new ComboServiceAssignmentModal

### 5. **Potential Issues to Watch For**

#### **Data Integrity**
- Existing combos without primary employees may cause booking errors
- Ensure all combos have primary employees assigned before allowing bookings

#### **Employee Eligibility**
- Combos can only be booked by employees who can perform ALL services
- Verify employee-service assignments are correct

#### **Time Slot Conflicts**
- Combo bookings now block entire time blocks
- Ensure time slot generation considers combo reservations

### 6. **Rollback Plan**

If issues arise, you can rollback by:

1. **Drop new tables**:
   ```sql
   DROP TABLE IF EXISTS combo_service_assignments;
   DROP TABLE IF EXISTS combo_reservations;
   ```

2. **Remove primary_employee_id from combos**:
   ```sql
   ALTER TABLE combos DROP COLUMN IF EXISTS primary_employee_id;
   ```

3. **Revert code changes** to previous versions

### 7. **Testing Checklist**

#### **Before Going Live**
- [ ] Create new combo with primary employee
- [ ] Book combo appointment (customer flow)
- [ ] Book combo appointment (admin flow)
- [ ] Assign specific employees to combo services
- [ ] Verify time slot conflicts are properly handled
- [ ] Test combo reservation updates and cancellations

#### **Edge Cases to Test**
- [ ] Combo with services that have different employee eligibility
- [ ] Combo booking when primary employee is unavailable
- [ ] Combo service assignment changes
- [ ] Combo completion and status updates

### 8. **User Training Required**

#### **For Admins**
- How to assign primary employees to combos
- How to manage service-specific employee assignments
- Understanding the new combo reservation system

#### **For Employees**
- How to view their assigned combo services
- How to update service status and timing
- Understanding their role in combo execution

### 9. **Performance Considerations**

#### **Database Indexes**
- New indexes added for combo reservations
- Monitor query performance after migration
- Consider additional indexes based on usage patterns

#### **Data Volume**
- Combo reservations will create multiple service assignments
- Monitor table growth and performance impact

### 10. **Success Criteria**

The migration is successful when:

✅ **All existing combos have primary employees assigned**  
✅ **New combo creation requires primary employee selection**  
✅ **Combo bookings create single reservations with proper tracking**  
✅ **Service assignments are automatically created**  
✅ **Employee management works for individual services within combos**  
✅ **Time slot conflicts are properly prevented**  
✅ **All existing functionality continues to work**  

---

## 🚀 **Ready to Proceed?**

Once you've reviewed this checklist and are confident in the implementation:

1. **Backup your database** (if possible)
2. **Run the migrations in order**
3. **Update existing combos** with primary employees
4. **Test the system thoroughly**
5. **Go live with the enhanced combo system**

The enhanced combo reservation system will provide significant improvements in salon operations, employee management, and customer experience! 🎉
